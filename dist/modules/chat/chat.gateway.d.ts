import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';
import { ChatRoomType } from './chat.entity';
interface AuthSocket extends Socket {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly jwtService;
    private readonly cfg;
    private readonly redis;
    server: Server;
    private readonly logger;
    private onlineUsers;
    private onlineAgents;
    constructor(chatService: ChatService, jwtService: JwtService, cfg: ConfigService, redis: RedisService);
    afterInit(server: Server): void;
    handleConnection(client: AuthSocket): Promise<void>;
    handleDisconnect(client: AuthSocket): Promise<void>;
    handleJoinRoom(client: AuthSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleLeaveRoom(client: AuthSocket, data: {
        roomId: string;
    }): void;
    handleSendMessage(client: AuthSocket, data: {
        roomId?: string;
        content: string;
        type?: ChatRoomType;
        productId?: string;
        orderId?: string;
        agentId?: string;
    }): Promise<void>;
    handleRequestHuman(client: AuthSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleAgentSend(client: AuthSocket, data: {
        roomId: string;
        content: string;
    }): Promise<void>;
    handleTyping(client: AuthSocket, data: {
        roomId: string;
        isTyping: boolean;
    }): void;
    handleCloseRoom(client: AuthSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleCheckOnline(client: AuthSocket, data: {
        userId: string;
    }): Promise<void>;
    emitToUser(userId: string, event: string, data: any): void;
    emitToRoom(roomId: string, event: string, data: any): void;
    get agentCount(): number;
    get onlineUserCount(): number;
}
export {};
