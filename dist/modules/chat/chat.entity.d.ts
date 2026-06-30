import { User } from '../users/user.entity';
export declare enum ChatRoomType {
    AI_SUPPORT = "ai_support",
    HUMAN_SUPPORT = "human_support",
    BUYER_SELLER = "buyer_seller"
}
export declare enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system",
    HUMAN_AGENT = "human_agent"
}
export declare enum ChatRoomStatus {
    OPEN = "open",
    ACTIVE = "active",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare class ChatRoom {
    id: string;
    userId: string;
    agentId: string;
    productId: string;
    orderId: string;
    type: ChatRoomType;
    status: ChatRoomStatus;
    subject: string;
    messageCount: number;
    lastMessageAt: Date;
    resolvedAt: Date;
    user: User;
    agent: User;
    createdAt: Date;
}
export declare class ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    role: MessageRole;
    content: string;
    metadata: Record<string, any>;
    isRead: boolean;
    readAt: Date;
    createdAt: Date;
}
