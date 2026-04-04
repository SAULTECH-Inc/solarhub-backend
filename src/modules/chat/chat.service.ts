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
import { NotificationsService } from '../notifications/notifications.service';
import { paginate, paginationToSkipTake } from '@common/utils/pagination.util';


const SOLAR_BOT_SYSTEM = `You are SolarBot, an expert solar energy assistant for SolarHub — Nigeria's #1 solar products marketplace.

You help customers with:
- Solar system sizing and component selection (panels, batteries, inverters, charge controllers)
- Product comparisons and technical specifications
- Pricing guidance in Nigerian Naira (₦)
- Installation advice for Nigerian climate conditions (high irradiance, harmattan dust considerations)
- Order tracking and delivery questions
- Post-purchase support and troubleshooting

Guidelines:
- Be concise but thorough (3-5 sentences usually sufficient)
- Always use ₦ for prices
- Reference Nigerian cities/states when relevant
- If unsure, recommend speaking with a certified solar installer
- For complex system design questions, suggest the Solar Advisor tool on SolarHub
- Never make up specific product prices — say "check current listings on SolarHub"
- Be warm, professional, and helpful in Nigerian English`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly anthropic: Anthropic;
  private readonly openai: OpenAI;

  constructor(
    @InjectRepository(ChatRoom)  private readonly roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatMessage) private readonly msgRepo: Repository<ChatMessage>,
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
    // For AI support or peer-to-peer, reuse open room if it exists
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
        { agentId: userId, type: ChatRoomType.BUYER_SELLER }
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

  async getRoomMessages(
    roomId: string,
    page: number,
    limit: number,
  ) {
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

  // ── AI response generation (Claude primary, OpenAI fallback) ─
  async generateAiResponse(
    roomId: string,
    userMessage: string,
    userId: string,
  ): Promise<string> {
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

    try {
      const response = await this.anthropic.messages.create({
        model: this.cfg.get('anthropic.model', 'claude-haiku-4-5-20251001'),
        max_tokens: 512,
        system: SOLAR_BOT_SYSTEM,
        messages: anthropicMessages,
      });
      return (response.content[0] as any).text;
    } catch (err) {
      this.logger.warn(`Claude failed, falling back to OpenAI: ${err.message}`);
      return this.openAiFallback(anthropicMessages.slice(-10), userMessage);
    }
  }

  private async openAiFallback(
    history: Array<{ role: string; content: string | any }>,
    userMessage: string,
  ): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SOLAR_BOT_SYSTEM },
      ...history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const resp = await this.openai.chat.completions.create({
      model: this.cfg.get('openai.model', 'gpt-4o-mini'),
      messages,
      max_tokens: 512,
      temperature: 0.7,
    });
    return resp.choices[0].message.content || 'I apologize, I\'m having trouble responding right now. Please try again.';
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
