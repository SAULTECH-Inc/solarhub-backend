"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const sdk_1 = require("@anthropic-ai/sdk");
const openai_1 = require("openai");
const chat_entity_1 = require("./chat.entity");
const product_entity_1 = require("../products/product.entity");
const engineer_entity_1 = require("../engineers/engineer.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
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
const SOLARBOT_TOOLS = [
    {
        name: 'search_products',
        description: 'Search Solar Maket marketplace for solar products. Returns live listings with prices, ratings, and stock availability.',
        input_schema: {
            type: 'object',
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
            type: 'object',
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
let ChatService = ChatService_1 = class ChatService {
    constructor(roomRepo, msgRepo, productRepo, engineerRepo, cfg, notif) {
        this.roomRepo = roomRepo;
        this.msgRepo = msgRepo;
        this.productRepo = productRepo;
        this.engineerRepo = engineerRepo;
        this.cfg = cfg;
        this.notif = notif;
        this.logger = new common_1.Logger(ChatService_1.name);
        this.anthropic = new sdk_1.default({ apiKey: cfg.get('anthropic.apiKey') });
        this.openai = new openai_1.default({ apiKey: cfg.get('openai.apiKey') });
    }
    async getOrCreateRoom(userId, type = chat_entity_1.ChatRoomType.AI_SUPPORT, opts) {
        if (type === chat_entity_1.ChatRoomType.AI_SUPPORT || type === chat_entity_1.ChatRoomType.BUYER_SELLER) {
            const whereClause = { userId, type, status: chat_entity_1.ChatRoomStatus.OPEN };
            if (opts?.agentId)
                whereClause.agentId = opts.agentId;
            const existing = await this.roomRepo.findOne({
                where: whereClause,
                order: { createdAt: 'DESC' },
            });
            if (existing)
                return existing;
        }
        return this.roomRepo.save(this.roomRepo.create({ userId, type, ...opts }));
    }
    async getRoomById(id) {
        const room = await this.roomRepo.findOne({
            where: { id },
            relations: ['user', 'agent'],
        });
        if (!room)
            throw new common_1.NotFoundException('Chat room not found');
        return room;
    }
    async getUserRooms(userId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.roomRepo.findAndCount({
            where: [
                { userId },
                { agentId: userId, type: chat_entity_1.ChatRoomType.BUYER_SELLER },
            ],
            relations: ['user', 'agent'],
            order: { lastMessageAt: 'DESC' },
            skip, take,
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async closeRoom(roomId) {
        await this.roomRepo.update(roomId, {
            status: chat_entity_1.ChatRoomStatus.RESOLVED,
            resolvedAt: new Date(),
        });
        return this.getRoomById(roomId);
    }
    async assignAgent(roomId, agentId) {
        await this.roomRepo.update(roomId, {
            agentId,
            type: chat_entity_1.ChatRoomType.HUMAN_SUPPORT,
            status: chat_entity_1.ChatRoomStatus.ACTIVE,
        });
        return this.getRoomById(roomId);
    }
    async saveMessage(roomId, content, role, senderId, metadata) {
        const msg = await this.msgRepo.save(this.msgRepo.create({ roomId, content, role, senderId, metadata }));
        await this.roomRepo.update(roomId, {
            lastMessageAt: new Date(),
            messageCount: () => '"messageCount" + 1',
        });
        return msg;
    }
    async getRoomMessages(roomId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.msgRepo.findAndCount({
            where: { roomId },
            order: { createdAt: 'DESC' },
            skip, take,
        });
        return (0, pagination_util_1.paginate)(data.reverse(), total, page, limit);
    }
    async markMessagesRead(roomId, userId) {
        await this.msgRepo.update({ roomId, isRead: false }, { isRead: true, readAt: new Date() });
    }
    async generateAiResponse(roomId, userMessage, userId) {
        const history = await this.msgRepo.find({
            where: { roomId },
            order: { createdAt: 'DESC' },
            take: 20,
        });
        const recentHistory = history.reverse().filter(m => m.role === chat_entity_1.MessageRole.USER || m.role === chat_entity_1.MessageRole.ASSISTANT);
        const anthropicMessages = recentHistory.map(m => ({
            role: m.role === chat_entity_1.MessageRole.USER ? 'user' : 'assistant',
            content: m.content,
        }));
        anthropicMessages.push({ role: 'user', content: userMessage });
        const model = this.cfg.get('anthropic.model', 'claude-haiku-4-5-20251001');
        const allToolResults = [];
        try {
            let response = await this.anthropic.messages.create({
                model,
                max_tokens: 1024,
                system: SOLAR_BOT_SYSTEM,
                tools: SOLARBOT_TOOLS,
                messages: anthropicMessages,
            });
            let rounds = 0;
            while (response.stop_reason === 'tool_use' && rounds < 3) {
                rounds++;
                const toolBlocks = response.content.filter((b) => b.type === 'tool_use');
                const toolResults = await Promise.all(toolBlocks.map(async (block) => {
                    let result;
                    try {
                        result = await this.executeTool(block.name, block.input);
                        allToolResults.push({ tool: block.name, result });
                    }
                    catch (e) {
                        result = { error: e.message };
                    }
                    return {
                        type: 'tool_result',
                        tool_use_id: block.id,
                        content: JSON.stringify(result),
                    };
                }));
                anthropicMessages.push({ role: 'assistant', content: response.content }, { role: 'user', content: toolResults });
                response = await this.anthropic.messages.create({
                    model,
                    max_tokens: 1024,
                    system: SOLAR_BOT_SYSTEM,
                    tools: SOLARBOT_TOOLS,
                    messages: anthropicMessages,
                });
            }
            const textBlock = response.content.find((b) => b.type === 'text');
            const text = textBlock?.text ||
                "I'm having trouble responding right now. Please try again.";
            return { text, metadata: this.buildRichMetadata(allToolResults) };
        }
        catch (err) {
            this.logger.warn(`Claude failed, falling back to OpenAI: ${err.message}`);
            const text = await this.openAiFallback(anthropicMessages.slice(-10), userMessage);
            return { text };
        }
    }
    async executeTool(name, input) {
        switch (name) {
            case 'search_products': return this.toolSearchProducts(input);
            case 'search_engineers': return this.toolSearchEngineers(input);
            default: return { error: `Unknown tool: ${name}` };
        }
    }
    async toolSearchProducts(input) {
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
        if (maxPrice)
            qb = qb.andWhere('p.price <= :maxPrice', { maxPrice: Number(maxPrice) });
        switch (sortBy) {
            case 'price_asc':
                qb = qb.orderBy('p.price', 'ASC');
                break;
            case 'price_desc':
                qb = qb.orderBy('p.price', 'DESC');
                break;
            case 'newest':
                qb = qb.orderBy('p.createdAt', 'DESC');
                break;
            default: qb = qb.orderBy('p.averageRating', 'DESC').addOrderBy('p.reviewCount', 'DESC');
        }
        const products = await qb.take(take).getMany();
        if (!products.length) {
            return { found: 0, products: [], message: `No products found for "${query}" on Solar Maket.` };
        }
        return {
            found: products.length,
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: Number(p.price),
                currency: p.currency || 'NGN',
                thumbnail: p.thumbnail,
                rating: Number(p.averageRating),
                reviews: p.reviewCount,
                brand: p.brand,
                location: [p.sellerCity, p.sellerState].filter(Boolean).join(', ') || 'Nigeria',
                url: `/product/${p.slug}`,
            })),
        };
    }
    async toolSearchEngineers(input) {
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
        if (state)
            qb = qb.andWhere('e.state ILIKE :state', { state: `%${state}%` });
        if (city)
            qb = qb.andWhere('e.city  ILIKE :city', { city: `%${city}%` });
        if (specialization)
            qb = qb.andWhere("e.specializations::text ILIKE :spec", { spec: `%${specialization}%` });
        qb = qb
            .orderBy('e.isVerified', 'DESC')
            .addOrderBy('e.averageRating', 'DESC')
            .addOrderBy('e.completedJobs', 'DESC');
        const engineers = await qb.take(take).getMany();
        if (!engineers.length) {
            return { found: 0, engineers: [], message: 'No engineers found matching your criteria.' };
        }
        return {
            found: engineers.length,
            engineers: engineers.map(e => ({
                id: e.id,
                name: e.fullName,
                city: e.city,
                state: e.state,
                yearsOfExperience: e.yearsOfExperience,
                specializations: e.specializations,
                rating: Number(e.averageRating),
                completedJobs: e.completedJobs,
                isVerified: e.isVerified,
                profilePhoto: e.profilePhoto || null,
                bio: e.bio ? e.bio.slice(0, 180) : null,
                serviceRadiusKm: e.serviceRadiusKm,
                url: `/engineers/${e.id}`,
            })),
        };
    }
    buildRichMetadata(toolResults) {
        if (!toolResults.length)
            return undefined;
        const products = [];
        const engineers = [];
        for (const { tool, result } of toolResults) {
            if (tool === 'search_products' && result.products)
                products.push(...result.products);
            if (tool === 'search_engineers' && result.engineers)
                engineers.push(...result.engineers);
        }
        if (!products.length && !engineers.length)
            return undefined;
        return {
            richContent: {
                type: products.length && engineers.length ? 'mixed' : products.length ? 'products' : 'engineers',
                products: products.length ? products : undefined,
                engineers: engineers.length ? engineers : undefined,
            },
        };
    }
    async openAiFallback(history, userMessage) {
        const messages = [
            { role: 'system', content: SOLAR_BOT_SYSTEM },
            ...history.map(m => ({
                role: m.role,
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
    async getQueuedRooms(page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.roomRepo.findAndCount({
            where: { type: chat_entity_1.ChatRoomType.HUMAN_SUPPORT, status: chat_entity_1.ChatRoomStatus.OPEN },
            relations: ['user'],
            order: { createdAt: 'ASC' },
            skip, take,
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getAgentRooms(agentId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.roomRepo.findAndCount({
            where: { agentId, status: chat_entity_1.ChatRoomStatus.ACTIVE },
            relations: ['user'],
            order: { lastMessageAt: 'DESC' },
            skip, take,
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getChatStats() {
        const [total, open, active, resolved] = await Promise.all([
            this.roomRepo.count(),
            this.roomRepo.count({ where: { status: chat_entity_1.ChatRoomStatus.OPEN } }),
            this.roomRepo.count({ where: { status: chat_entity_1.ChatRoomStatus.ACTIVE } }),
            this.roomRepo.count({ where: { status: chat_entity_1.ChatRoomStatus.RESOLVED } }),
        ]);
        return { total, open, active, resolved };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_entity_1.ChatRoom)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_entity_1.ChatMessage)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(engineer_entity_1.Engineer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map