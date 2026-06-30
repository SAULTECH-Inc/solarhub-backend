import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';
import { ChatRoomType, MessageRole, ChatRoomStatus } from './chat.entity';

interface AuthSocket extends Socket {
  user?: { id: string; email: string; role: string };
}

@WebSocketGateway({
  cors: {
    origin: (origin: string, cb: Function) => cb(null, true),
    credentials: true,
  },
  namespace: '/chat',
  transports: ['websocket', 'polling'],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  // Track online users: userId → Set<socketId>
  private onlineUsers = new Map<string, Set<string>>();
  // Track agent availability
  private onlineAgents = new Set<string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly cfg: ConfigService,
    private readonly redis: RedisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('✅ Chat WebSocket gateway initialized');
  }

  // ── Connection / disconnection ────────────────────────────
  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        // Allow anonymous connection (guest chat)
        client.user = null;
        this.logger.debug(`Guest connected: ${client.id}`);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.cfg.get('jwt.secret'),
      });
      client.user = { id: payload.sub, email: payload.email, role: payload.role };

      // Track online users
      if (!this.onlineUsers.has(client.user.id)) {
        this.onlineUsers.set(client.user.id, new Set());
      }
      this.onlineUsers.get(client.user.id).add(client.id);

      // Track agents
      if (client.user.role === 'admin') {
        this.onlineAgents.add(client.user.id);
        await this.redis.set(`agent:online:${client.user.id}`, '1', 300);
      }

      await this.redis.set(`user:online:${client.user.id}`, '1', 300);
      this.logger.log(`User connected: ${client.user.email} (${client.id})`);

      // Join user's personal room for targeted messages
      client.join(`user:${client.user.id}`);
      client.emit('connected', { userId: client.user.id, socketId: client.id });
    } catch (err) {
      this.logger.warn(`Auth failed for socket ${client.id}: ${err.message}`);
      client.user = null;
      client.emit('connected', { guest: true });
    }
  }

  async handleDisconnect(client: AuthSocket) {
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

  // ── Events ─────────────────────────────────────────────────

  /**
   * Join a chat room to receive messages
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(`room:${data.roomId}`);
    await this.chatService.markMessagesRead(data.roomId, client.user?.id);
    const messages = await this.chatService.getRoomMessages(data.roomId, 1, 50);
    client.emit('room_history', messages);
    this.logger.debug(`${client.user?.email || 'guest'} joined room ${data.roomId}`);
  }

  /**
   * Leave a chat room
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`room:${data.roomId}`);
  }

  /**
   * User sends a message (AI or human agent)
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: {
      roomId?: string;
      content: string;
      type?: ChatRoomType;
      productId?: string;
      orderId?: string;
      agentId?: string;
    },
  ) {
    if (!data.content?.trim()) return;
    const userId = client.user?.id || `guest:${client.id}`;

    // Get or create room
    let room;
    if (data.roomId) {
      room = await this.chatService.getRoomById(data.roomId);
    } else {
      room = await this.chatService.getOrCreateRoom(
        userId,
        data.type || ChatRoomType.AI_SUPPORT,
        { productId: data.productId, orderId: data.orderId, agentId: data.agentId },
      );
      client.join(`room:${room.id}`);
      client.emit('room_created', { roomId: room.id });
    }

    // Save user message
    const userMsg = await this.chatService.saveMessage(
      room.id,
      data.content,
      MessageRole.USER,
      userId,
    );

    // Broadcast user message to room (for agents monitoring)
    this.server.to(`room:${room.id}`).emit('new_message', {
      ...userMsg,
      roomId: room.id,
    });

    // Emit typing indicator
    this.server.to(`room:${room.id}`).emit('agent_typing', {
      roomId: room.id,
      isTyping: true,
      agentName: room.type === ChatRoomType.HUMAN_SUPPORT ? 'Support Agent' : 'SolarBot',
    });

    try {
      if (room.type === ChatRoomType.BUYER_SELLER) {
        // Peer-to-peer message
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
      } else if (room.type === ChatRoomType.AI_SUPPORT || !room.agentId) {
        // AI response (may include rich tool-result metadata)
        const { text: aiText, metadata: aiMeta } = await this.chatService.generateAiResponse(
          room.id, data.content, userId,
        );
        const aiMsg = await this.chatService.saveMessage(
          room.id, aiText, MessageRole.ASSISTANT, undefined, aiMeta,
        );
        this.server.to(`room:${room.id}`).emit('new_message', {
          ...aiMsg, roomId: room.id,
        });
      } else {
        // Human agent support room — notify agent
        this.server.to(`user:${room.agentId}`).emit('new_customer_message', {
          roomId: room.id,
          message: userMsg,
          customerName: client.user?.email || 'Guest',
        });
      }
    } finally {
      this.server.to(`room:${room.id}`).emit('agent_typing', {
        roomId: room.id, isTyping: false,
      });
    }
  }

  /**
   * Request escalation to human agent
   */
  @SubscribeMessage('request_human')
  async handleRequestHuman(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const room = await this.chatService.getRoomById(data.roomId);

    // Find available agent
    const availableAgent = Array.from(this.onlineAgents)[0];
    if (availableAgent) {
      await this.chatService.assignAgent(room.id, availableAgent);
      // Notify the agent
      this.server.to(`user:${availableAgent}`).emit('new_chat_assigned', {
        roomId: room.id,
        userId: room.userId,
        subject: room.subject,
      });
      // Save system message
      await this.chatService.saveMessage(
        room.id,
        `You are now connected with a live support agent.`,
        MessageRole.SYSTEM,
      );
      this.server.to(`room:${room.id}`).emit('human_agent_joined', {
        roomId: room.id,
        agentId: availableAgent,
        message: 'A support agent has joined the conversation.',
      });
    } else {
      // No agents online — put in queue
      const queuePos = await this.redis.incr('chat:queue:count');
      await this.redis.expire('chat:queue:count', 86400);
      client.emit('queued', {
        roomId: room.id,
        position: queuePos,
        message: `All agents are currently busy. You are #${queuePos} in the queue. Our AI assistant will continue helping you.`,
      });
    }
  }

  /**
   * Agent sends a message to a customer room
   */
  @SubscribeMessage('agent_send')
  async handleAgentSend(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    if (!client.user || client.user.role !== 'admin') {
      throw new WsException('Unauthorized');
    }
    const msg = await this.chatService.saveMessage(
      data.roomId,
      data.content,
      MessageRole.HUMAN_AGENT,
      client.user.id,
    );
    this.server.to(`room:${data.roomId}`).emit('new_message', {
      ...msg, roomId: data.roomId,
      agentName: client.user.email,
    });
  }

  /**
   * Typing indicator
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    client.to(`room:${data.roomId}`).emit('user_typing', {
      roomId: data.roomId,
      isTyping: data.isTyping,
      userId: client.user?.id,
    });
  }

  /**
   * Close/resolve a room
   */
  @SubscribeMessage('close_room')
  async handleCloseRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomId: string },
  ) {
    await this.chatService.closeRoom(data.roomId);
    this.server.to(`room:${data.roomId}`).emit('room_closed', {
      roomId: data.roomId,
      message: 'This conversation has been resolved. Thank you for contacting Solar Maket!',
    });
  }

  /**
   * Check if a user is online (for agent view)
   */
  @SubscribeMessage('check_online')
  async handleCheckOnline(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { userId: string },
  ) {
    const online = await this.redis.exists(`user:online:${data.userId}`);
    client.emit('online_status', { userId: data.userId, online });
  }

  // ── Utility: emit to a specific user ─────────────────────
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRoom(roomId: string, event: string, data: any) {
    this.server.to(`room:${roomId}`).emit(event, data);
  }

  get agentCount(): number { return this.onlineAgents.size; }
  get onlineUserCount(): number { return this.onlineUsers.size; }
}
