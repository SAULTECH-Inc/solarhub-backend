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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const chat_service_1 = require("./chat.service");
const redis_service_1 = require("../redis/redis.service");
const chat_entity_1 = require("./chat.entity");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor(chatService, jwtService, cfg, redis) {
        this.chatService = chatService;
        this.jwtService = jwtService;
        this.cfg = cfg;
        this.redis = redis;
        this.logger = new common_1.Logger(ChatGateway_1.name);
        this.onlineUsers = new Map();
        this.onlineAgents = new Set();
    }
    afterInit(server) {
        this.logger.log('✅ Chat WebSocket gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                client.user = null;
                this.logger.debug(`Guest connected: ${client.id}`);
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: this.cfg.get('jwt.secret'),
            });
            client.user = { id: payload.sub, email: payload.email, role: payload.role };
            if (!this.onlineUsers.has(client.user.id)) {
                this.onlineUsers.set(client.user.id, new Set());
            }
            this.onlineUsers.get(client.user.id).add(client.id);
            if (client.user.role === 'admin') {
                this.onlineAgents.add(client.user.id);
                await this.redis.set(`agent:online:${client.user.id}`, '1', 300);
            }
            await this.redis.set(`user:online:${client.user.id}`, '1', 300);
            this.logger.log(`User connected: ${client.user.email} (${client.id})`);
            client.join(`user:${client.user.id}`);
            client.emit('connected', { userId: client.user.id, socketId: client.id });
        }
        catch (err) {
            this.logger.warn(`Auth failed for socket ${client.id}: ${err.message}`);
            client.user = null;
            client.emit('connected', { guest: true });
        }
    }
    async handleDisconnect(client) {
        if (client.user) {
            const sockets = this.onlineUsers.get(client.user.id);
            sockets?.delete(client.id);
            if (!sockets?.size) {
                this.onlineUsers.delete(client.user.id);
                await this.redis.del(`user:online:${client.user.id}`);
            }
            if (client.user.role === 'admin') {
                const hasOtherSockets = (this.onlineUsers.get(client.user.id)?.size || 0) > 0;
                if (!hasOtherSockets) {
                    this.onlineAgents.delete(client.user.id);
                    await this.redis.del(`agent:online:${client.user.id}`);
                }
            }
        }
        this.logger.debug(`Disconnected: ${client.id}`);
    }
    async handleJoinRoom(client, data) {
        client.join(`room:${data.roomId}`);
        await this.chatService.markMessagesRead(data.roomId, client.user?.id);
        const messages = await this.chatService.getRoomMessages(data.roomId, 1, 50);
        client.emit('room_history', messages);
        this.logger.debug(`${client.user?.email || 'guest'} joined room ${data.roomId}`);
    }
    handleLeaveRoom(client, data) {
        client.leave(`room:${data.roomId}`);
    }
    async handleSendMessage(client, data) {
        if (!data.content?.trim())
            return;
        const userId = client.user?.id || `guest:${client.id}`;
        let room;
        if (data.roomId) {
            room = await this.chatService.getRoomById(data.roomId);
        }
        else {
            room = await this.chatService.getOrCreateRoom(userId, data.type || chat_entity_1.ChatRoomType.AI_SUPPORT, { productId: data.productId, orderId: data.orderId, agentId: data.agentId });
            client.join(`room:${room.id}`);
            client.emit('room_created', { roomId: room.id });
        }
        const userMsg = await this.chatService.saveMessage(room.id, data.content, chat_entity_1.MessageRole.USER, userId);
        this.server.to(`room:${room.id}`).emit('new_message', {
            ...userMsg,
            roomId: room.id,
        });
        this.server.to(`room:${room.id}`).emit('agent_typing', {
            roomId: room.id,
            isTyping: true,
            agentName: room.type === chat_entity_1.ChatRoomType.HUMAN_SUPPORT ? 'Support Agent' : 'SolarBot',
        });
        try {
            if (room.type === chat_entity_1.ChatRoomType.BUYER_SELLER) {
                const targetUserId = client.user?.id === room.userId ? room.agentId : room.userId;
                if (targetUserId) {
                    this.server.to(`user:${targetUserId}`).emit('new_message', {
                        ...userMsg, roomId: room.id,
                    });
                    this.server.to(`user:${targetUserId}`).emit('new_customer_message', {
                        roomId: room.id,
                        message: userMsg,
                        customerName: client.user?.email || 'User',
                    });
                }
            }
            else if (room.type === chat_entity_1.ChatRoomType.AI_SUPPORT || !room.agentId) {
                const { text: aiText, metadata: aiMeta } = await this.chatService.generateAiResponse(room.id, data.content, userId);
                const aiMsg = await this.chatService.saveMessage(room.id, aiText, chat_entity_1.MessageRole.ASSISTANT, undefined, aiMeta);
                this.server.to(`room:${room.id}`).emit('new_message', {
                    ...aiMsg, roomId: room.id,
                });
            }
            else {
                this.server.to(`user:${room.agentId}`).emit('new_customer_message', {
                    roomId: room.id,
                    message: userMsg,
                    customerName: client.user?.email || 'Guest',
                });
            }
        }
        finally {
            this.server.to(`room:${room.id}`).emit('agent_typing', {
                roomId: room.id, isTyping: false,
            });
        }
    }
    async handleRequestHuman(client, data) {
        const room = await this.chatService.getRoomById(data.roomId);
        const availableAgent = Array.from(this.onlineAgents)[0];
        if (availableAgent) {
            await this.chatService.assignAgent(room.id, availableAgent);
            this.server.to(`user:${availableAgent}`).emit('new_chat_assigned', {
                roomId: room.id,
                userId: room.userId,
                subject: room.subject,
            });
            await this.chatService.saveMessage(room.id, `You are now connected with a live support agent.`, chat_entity_1.MessageRole.SYSTEM);
            this.server.to(`room:${room.id}`).emit('human_agent_joined', {
                roomId: room.id,
                agentId: availableAgent,
                message: 'A support agent has joined the conversation.',
            });
        }
        else {
            const queuePos = await this.redis.incr('chat:queue:count');
            await this.redis.expire('chat:queue:count', 86400);
            client.emit('queued', {
                roomId: room.id,
                position: queuePos,
                message: `All agents are currently busy. You are #${queuePos} in the queue. Our AI assistant will continue helping you.`,
            });
        }
    }
    async handleAgentSend(client, data) {
        if (!client.user || client.user.role !== 'admin') {
            throw new websockets_1.WsException('Unauthorized');
        }
        const msg = await this.chatService.saveMessage(data.roomId, data.content, chat_entity_1.MessageRole.HUMAN_AGENT, client.user.id);
        this.server.to(`room:${data.roomId}`).emit('new_message', {
            ...msg, roomId: data.roomId,
            agentName: client.user.email,
        });
    }
    handleTyping(client, data) {
        client.to(`room:${data.roomId}`).emit('user_typing', {
            roomId: data.roomId,
            isTyping: data.isTyping,
            userId: client.user?.id,
        });
    }
    async handleCloseRoom(client, data) {
        await this.chatService.closeRoom(data.roomId);
        this.server.to(`room:${data.roomId}`).emit('room_closed', {
            roomId: data.roomId,
            message: 'This conversation has been resolved. Thank you for contacting Solar Maket!',
        });
    }
    async handleCheckOnline(client, data) {
        const online = await this.redis.exists(`user:online:${data.userId}`);
        client.emit('online_status', { userId: data.userId, online });
    }
    emitToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    emitToRoom(roomId, event, data) {
        this.server.to(`room:${roomId}`).emit(event, data);
    }
    get agentCount() { return this.onlineAgents.size; }
    get onlineUserCount() { return this.onlineUsers.size; }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('request_human'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleRequestHuman", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('agent_send'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleAgentSend", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('close_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCloseRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('check_online'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCheckOnline", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (origin, cb) => cb(null, true),
            credentials: true,
        },
        namespace: '/chat',
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map