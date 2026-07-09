import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatRoomType } from './chat.entity';
export declare class ChatController {
    private readonly svc;
    private readonly gateway;
    constructor(svc: ChatService, gateway: ChatGateway);
    getMyRooms(uid: string, p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./chat.entity").ChatRoom>>;
    createRoom(uid: string, body: {
        type?: ChatRoomType;
        productId?: string;
        orderId?: string;
        subject?: string;
        agentId?: string;
    }): Promise<import("./chat.entity").ChatRoom>;
    getRoom(id: string): Promise<import("./chat.entity").ChatRoom>;
    getMessages(id: string, p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./chat.entity").ChatMessage>>;
    closeRoom(id: string): Promise<import("./chat.entity").ChatRoom>;
    markRead(id: string, uid: string): Promise<void>;
    getQueue(p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./chat.entity").ChatRoom>>;
    getAgentRooms(uid: string, p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./chat.entity").ChatRoom>>;
    assignAgent(id: string, uid: string): Promise<import("./chat.entity").ChatRoom>;
    getStats(): Promise<{
        total: number;
        open: number;
        active: number;
        resolved: number;
    }>;
    getGatewayStats(): {
        onlineUsers: number;
        onlineAgents: number;
    };
}
