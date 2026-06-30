import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  ChatRoom, ChatMessage,
  ChatRoomType, ChatRoomStatus, MessageRole,
} from './chat.entity';
import { Product } from '../products/product.entity';
import { Engineer } from '../engineers/engineer.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { paginate, paginationToSkipTake } from '@common/utils/pagination.util';

const SOLAR_BOT_SYSTEM = `You are SolarBot, an expert solar energy assistant for Solar Maket — Nigeria's #1 solar products marketplace.

You have tools to search Solar Maket's live product catalog and verified engineer directory. Use them when users ask about:
- Specific products, prices, brands, or availability
- Finding solar engineers near their location
- Comparing solar panels, batteries, inverters, or controllers

You help customers with:
- Solar system sizing and component selection
- Product search and comparisons with live prices
- Finding verified solar installers near them
- Installation advice for Nigerian climate conditions
- Order and delivery questions
- Post-purchase support and troubleshooting

Guidelines:
- Be concise but helpful (3–5 sentences usually sufficient)
- Always use ₦ for prices
- Use search tools when users ask about specific products or engineers — don't guess prices
- Reference Nigerian cities/states when relevant
- If unsure, recommend speaking with a certified solar installer
- For full system design, suggest the Solar Advisor tool on Solar Maket

PRIVACY RULES — ALWAYS ENFORCED — NEVER VIOLATE:
- NEVER reveal another user's email address, phone number, home address, or payment details
- NEVER expose passwords, JWT tokens, API keys, service account keys, or any credentials
- NEVER describe internal database structure, admin endpoints, or system architecture details
- Product listings are public — you may describe them, their prices, and ratings freely
- Engineer public profiles are safe to share — name, city, state, specializations, rating, years of experience
- For account/order/transaction questions: direct the user to their Profile & Orders page`;

const SOLARBOT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_products',
    description: 'Search Solar Maket marketplace for solar products. Returns live listings with prices, ratings, and stock availability.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search term — be specific (e.g. "400W monocrystalline panel", "LiFePO4 200Ah battery", "5kva hybrid inverter")',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price in NGN (optional)',
        },
        sortBy: {
          type: 'string',
          enum: ['price_asc', 'price_desc', 'rating', 'newest'],
          description: 'Sort order. Default: rating',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (1–8, default 4)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_engineers',
    description: 'Search for verified solar engineers available for hire. Returns public profiles with location, specializations, and ratings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        state: {
          type: 'string',
          description: 'Nigerian state name (e.g. "Lagos", "Rivers", "FCT")',
        },
        city: {
          type: 'string',
          description: 'City name (optional, narrows results)',
        },
        specialization: {
          type: 'string',
          description: 'Type of work (e.g. "off-grid", "hybrid inverter", "battery installation")',
        },
        limit: {
          type: 'number',
          description: 'Max results (1–5, default 3)',
        },
      },
      required: [],
    },
  },
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly anthropic: Anthropic;
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(ChatRoom)    private readonly roomRepo:     Repository<ChatRoom>,
    @InjectRepository(ChatMessage) private readonly msgRepo:      Repository<ChatMessage>,
    @InjectRepository(Product)     private readonly productRepo:  Repository<Product>,
    @InjectRepository(Engineer)    private readonly engineerRepo: Repository<Engineer>,
    private readonly cfg: ConfigService,
    private readonly notif: NotificationsService,
  ) {
    this.anthropic = new Anthropic({ apiKey: cfg.get('anthropic.apiKey') });
    this.openai    = new OpenAI({ apiKey: cfg.get('openai.apiKey') });
  }

  // ── Room management ────────────────────────────────────────
  async getOrCreateRoom(
    userId: string,
    type: ChatRoomType = ChatRoomType.AI_SUPPORT,
    opts?: { productId?: string; orderId?: string; subject?: string; agentId?: string },
  ): Promise<ChatRoom> {
    if (type === ChatRoomType.AI_SUPPORT || type === ChatRoomType.BUYER_SELLER) {
      const whereClause: any = { userId, type, status: ChatRoomStatus.OPEN };
      if (opts?.agentId) whereClause.agentId = opts.agentId;

      const existing = await this.roomRepo.findOne({
        where: whereClause,
        order: { createdAt: 'DESC' },
      });
      if (existing) return existing;
    }

    return this.roomRepo.save(
      this.roomRepo.create({ userId, type, ...opts }),
    );
  }

  async getRoomById(id: string): Promise<ChatRoom> {
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: ['user', 'agent'],
    });
    if (!room) throw new NotFoundException('Chat room not found');
    return room;
  }

  async getUserRooms(userId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.roomRepo.findAndCount({
      where: [
        { userId },
        { agentId: userId, type: ChatRoomType.BUYER_SELLER },
      ],
      relations: ['user', 'agent'],
      order: { lastMessageAt: 'DESC' },
      skip, take,
    });
    return paginate(data, total, page, limit);
  }

  async closeRoom(roomId: string): Promise<ChatRoom> {
    await this.roomRepo.update(roomId, {
      status: ChatRoomStatus.RESOLVED,
      resolvedAt: new Date(),
    });
    return this.getRoomById(roomId);
  }

  async assignAgent(roomId: string, agentId: string): Promise<ChatRoom> {
    await this.roomRepo.update(roomId, {
      agentId,
      type: ChatRoomType.HUMAN_SUPPORT,
      status: ChatRoomStatus.ACTIVE,
    });
    return this.getRoomById(roomId);
  }

  // ── Message handling ──────────────────────────────────────
  async saveMessage(
    roomId: string,
    content: string,
    role: MessageRole,
    senderId?: string,
    metadata?: Record<string, any>,
  ): Promise<ChatMessage> {
    const msg = await this.msgRepo.save(
      this.msgRepo.create({ roomId, content, role, senderId, metadata }),
    );
    await this.roomRepo.update(roomId, {
      lastMessageAt: new Date(),
      messageCount: () => '"messageCount" + 1',
    });
    return msg;
  }

  async getRoomMessages(roomId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.msgRepo.findAndCount({
      where: { roomId },
      order: { createdAt: 'DESC' },
      skip, take,
    });
    return paginate(data.reverse(), total, page, limit);
  }

  async markMessagesRead(roomId: string, userId: string): Promise<void> {
    await this.msgRepo.update(
      { roomId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  // ── AI response generation (Claude with tool use) ─────────
  async generateAiResponse(
    roomId: string,
    userMessage: string,
    userId: string,
  ): Promise<{ text: string; metadata?: Record<string, any> }> {
    // Fetch recent history (last 20 messages for context)
    const history = await this.msgRepo.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    const recentHistory = history.reverse().filter(
      m => m.role === MessageRole.USER || m.role === MessageRole.ASSISTANT,
    );

    const anthropicMessages: Anthropic.Messages.MessageParam[] = recentHistory.map(m => ({
      role: m.role === MessageRole.USER ? 'user' : 'assistant',
      content: m.content,
    }));
    anthropicMessages.push({ role: 'user', content: userMessage });

    const model = this.cfg.get('anthropic.model', 'claude-haiku-4-5-20251001');
    const allToolResults: Array<{ tool: string; result: any }> = [];

    try {
      let response = await this.anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: SOLAR_BOT_SYSTEM,
        tools: SOLARBOT_TOOLS,
        messages: anthropicMessages,
      });

      // Tool use loop — Claude may chain tools; cap at 3 rounds to prevent runaway
      let rounds = 0;
      while (response.stop_reason === 'tool_use' && rounds < 3) {
        rounds++;

        const toolBlocks = response.content.filter(
          (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
        );

        const toolResults: Anthropic.Messages.ToolResultBlockParam[] = await Promise.all(
          toolBlocks.map(async (block) => {
            let result: any;
            try {
              result = await this.executeTool(block.name, block.input as Record<string, any>);
              allToolResults.push({ tool: block.name, result });
            } catch (e: any) {
              result = { error: e.message };
            }
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          }),
        );

        anthropicMessages.push(
          { role: 'assistant', content: response.content },
          { role: 'user',      content: toolResults },
        );

        response = await this.anthropic.messages.create({
          model,
          max_tokens: 1024,
          system: SOLAR_BOT_SYSTEM,
          tools: SOLARBOT_TOOLS,
          messages: anthropicMessages,
        });
      }

      const textBlock = response.content.find(
        (b): b is Anthropic.Messages.TextBlock => b.type === 'text',
      );
      const text = textBlock?.text ||
        "I'm having trouble responding right now. Please try again.";

      return { text, metadata: this.buildRichMetadata(allToolResults) };
    } catch (err: any) {
      this.logger.warn(`Claude failed, falling back to OpenAI: ${err.message}`);
      const text = await this.openAiFallback(anthropicMessages.slice(-10), userMessage);
      return { text };
    }
  }

  // ── Tool executors ─────────────────────────────────────────
  private async executeTool(
    name: string,
    input: Record<string, any>,
  ): Promise<any> {
    switch (name) {
      case 'search_products':  return this.toolSearchProducts(input);
      case 'search_engineers': return this.toolSearchEngineers(input);
      default: return { error: `Unknown tool: ${name}` };
    }
  }

  private async toolSearchProducts(input: Record<string, any>) {
    const { query, maxPrice, sortBy = 'rating', limit = 4 } = input;
    const take = Math.min(Math.max(1, Number(limit) || 4), 8);

    let qb = this.productRepo.createQueryBuilder('p')
      .where('p.status = :st', { st: 'active' })
      .andWhere('p.stock > 0')
      .andWhere('(p.name ILIKE :q OR p.brand ILIKE :q)', { q: `%${query}%` })
      .select([
        'p.id', 'p.name', 'p.slug', 'p.price',
        'p.thumbnail', 'p.averageRating', 'p.reviewCount',
        'p.brand', 'p.sellerCity', 'p.sellerState',
      ]);

    if (maxPrice) qb = qb.andWhere('p.price <= :maxPrice', { maxPrice: Number(maxPrice) });

    switch (sortBy) {
      case 'price_asc':  qb = qb.orderBy('p.price', 'ASC'); break;
      case 'price_desc': qb = qb.orderBy('p.price', 'DESC'); break;
      case 'newest':     qb = qb.orderBy('p.createdAt', 'DESC'); break;
      default:           qb = qb.orderBy('p.averageRating', 'DESC').addOrderBy('p.reviewCount', 'DESC');
    }

    const products = await qb.take(take).getMany();
    if (!products.length) {
      return { found: 0, products: [], message: `No products found for "${query}" on Solar Maket.` };
    }

    return {
      found: products.length,
      products: products.map(p => ({
        id:        p.id,
        name:      p.name,
        slug:      p.slug,
        price:     Number(p.price),
        currency:  (p as any).currency || 'NGN',
        thumbnail: p.thumbnail,
        rating:    Number(p.averageRating),
        reviews:   p.reviewCount,
        brand:     p.brand,
        location:  [p.sellerCity, p.sellerState].filter(Boolean).join(', ') || 'Nigeria',
        url:       `/product/${p.slug}`,
      })),
    };
  }

  private async toolSearchEngineers(input: Record<string, any>) {
    const { state, city, specialization, limit = 3 } = input;
    const take = Math.min(Math.max(1, Number(limit) || 3), 5);

    let qb = this.engineerRepo.createQueryBuilder('e')
      .where('e.status = :st', { st: 'active' })
      .andWhere('e.availableForHire = true')
      .select([
        'e.id', 'e.fullName', 'e.city', 'e.state',
        'e.yearsOfExperience', 'e.specializations',
        'e.averageRating', 'e.reviewCount', 'e.completedJobs',
        'e.isVerified', 'e.profilePhoto', 'e.bio', 'e.serviceRadiusKm',
      ]);

    if (state)          qb = qb.andWhere('e.state ILIKE :state', { state: `%${state}%` });
    if (city)           qb = qb.andWhere('e.city  ILIKE :city',  { city:  `%${city}%` });
    if (specialization) qb = qb.andWhere("e.specializations::text ILIKE :spec", { spec: `%${specialization}%` });

    qb = qb
      .orderBy('e.isVerified',    'DESC')
      .addOrderBy('e.averageRating', 'DESC')
      .addOrderBy('e.completedJobs', 'DESC');

    const engineers = await qb.take(take).getMany();
    if (!engineers.length) {
      return { found: 0, engineers: [], message: 'No engineers found matching your criteria.' };
    }

    return {
      found: engineers.length,
      engineers: engineers.map(e => ({
        id:               e.id,
        name:             e.fullName,
        city:             e.city,
        state:            e.state,
        yearsOfExperience: e.yearsOfExperience,
        specializations:  e.specializations,
        rating:           Number(e.averageRating),
        completedJobs:    e.completedJobs,
        isVerified:       e.isVerified,
        profilePhoto:     e.profilePhoto || null,
        bio:              e.bio ? e.bio.slice(0, 180) : null,
        serviceRadiusKm:  e.serviceRadiusKm,
        url:              `/engineers/${e.id}`,
      })),
    };
  }

  // Build metadata payload to attach to saved message (enables rich card rendering)
  private buildRichMetadata(
    toolResults: Array<{ tool: string; result: any }>,
  ): Record<string, any> | undefined {
    if (!toolResults.length) return undefined;

    const products: any[] = [];
    const engineers: any[] = [];

    for (const { tool, result } of toolResults) {
      if (tool === 'search_products'  && result.products)  products.push(...result.products);
      if (tool === 'search_engineers' && result.engineers) engineers.push(...result.engineers);
    }

    if (!products.length && !engineers.length) return undefined;

    return {
      richContent: {
        type:      products.length && engineers.length ? 'mixed' : products.length ? 'products' : 'engineers',
        products:  products.length  ? products  : undefined,
        engineers: engineers.length ? engineers : undefined,
      },
    };
  }

  // ── OpenAI fallback (no tool use) ─────────────────────────
  private async openAiFallback(
    history: Array<{ role: string; content: string | any }>,
    userMessage: string,
  ): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SOLAR_BOT_SYSTEM },
      ...history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      { role: 'user', content: userMessage },
    ];

    const resp = await this.openai.chat.completions.create({
      model: this.cfg.get('openai.model', 'gpt-4o-mini'),
      messages,
      max_tokens: 512,
      temperature: 0.7,
    });
    return resp.choices[0].message.content ||
      "I apologize, I'm having trouble responding right now. Please try again.";
  }

  // ── Agent queue (admin/support view) ─────────────────────
  async getQueuedRooms(page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.roomRepo.findAndCount({
      where: { type: ChatRoomType.HUMAN_SUPPORT, status: ChatRoomStatus.OPEN },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip, take,
    });
    return paginate(data, total, page, limit);
  }

  async getAgentRooms(agentId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.roomRepo.findAndCount({
      where: { agentId, status: ChatRoomStatus.ACTIVE },
      relations: ['user'],
      order: { lastMessageAt: 'DESC' },
      skip, take,
    });
    return paginate(data, total, page, limit);
  }

  async getChatStats() {
    const [total, open, active, resolved] = await Promise.all([
      this.roomRepo.count(),
      this.roomRepo.count({ where: { status: ChatRoomStatus.OPEN } }),
      this.roomRepo.count({ where: { status: ChatRoomStatus.ACTIVE } }),
      this.roomRepo.count({ where: { status: ChatRoomStatus.RESOLVED } }),
    ]);
    return { total, open, active, resolved };
  }
}
