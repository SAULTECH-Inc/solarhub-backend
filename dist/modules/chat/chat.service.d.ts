import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatRoom, ChatMessage, ChatRoomType, MessageRole } from './chat.entity';
import { Product } from '../products/product.entity';
import { Engineer } from '../engineers/engineer.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ChatService {
    private readonly roomRepo;
    private readonly msgRepo;
    private readonly productRepo;
    private readonly engineerRepo;
    private readonly cfg;
    private readonly notif;
    private readonly logger;
    private readonly anthropic;
    private readonly openai;
    constructor(roomRepo: Repository<ChatRoom>, msgRepo: Repository<ChatMessage>, productRepo: Repository<Product>, engineerRepo: Repository<Engineer>, cfg: ConfigService, notif: NotificationsService);
    getOrCreateRoom(userId: string, type?: ChatRoomType, opts?: {
        productId?: string;
        orderId?: string;
        subject?: string;
        agentId?: string;
    }): Promise<ChatRoom>;
    getRoomById(id: string): Promise<ChatRoom>;
    getUserRooms(userId: string, page: number, limit: number): Promise<import("@common/utils/pagination.util").PaginatedResult<ChatRoom>>;
    closeRoom(roomId: string): Promise<ChatRoom>;
    assignAgent(roomId: string, agentId: string): Promise<ChatRoom>;
    saveMessage(roomId: string, content: string, role: MessageRole, senderId?: string, metadata?: Record<string, any>): Promise<ChatMessage>;
    getRoomMessages(roomId: string, page: number, limit: number): Promise<import("@common/utils/pagination.util").PaginatedResult<ChatMessage>>;
    markMessagesRead(roomId: string, userId: string): Promise<void>;
    generateAiResponse(roomId: string, userMessage: string, userId: string): Promise<{
        text: string;
        metadata?: Record<string, any>;
    }>;
    private executeTool;
    private toolSearchProducts;
    private toolSearchEngineers;
    private buildRichMetadata;
    private openAiFallback;
    getQueuedRooms(page: number, limit: number): Promise<import("@common/utils/pagination.util").PaginatedResult<ChatRoom>>;
    getAgentRooms(agentId: string, page: number, limit: number): Promise<import("@common/utils/pagination.util").PaginatedResult<ChatRoom>>;
    getChatStats(): Promise<{
        total: number;
        open: number;
        active: number;
        resolved: number;
    }>;
}
