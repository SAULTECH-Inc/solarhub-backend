import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ChatRoomType {
  AI_SUPPORT    = 'ai_support',
  HUMAN_SUPPORT = 'human_support',
  BUYER_SELLER  = 'buyer_seller',
}

export enum MessageRole {
  USER      = 'user',
  ASSISTANT = 'assistant',
  SYSTEM    = 'system',
  HUMAN_AGENT = 'human_agent',
}

export enum ChatRoomStatus {
  OPEN      = 'open',
  ACTIVE    = 'active',
  RESOLVED  = 'resolved',
  CLOSED    = 'closed',
}

@Entity('chat_rooms')
@Index(['status'])
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ nullable: true })
  agentId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ type: 'enum', enum: ChatRoomType, default: ChatRoomType.AI_SUPPORT })
  type: ChatRoomType;

  @Column({ type: 'enum', enum: ChatRoomStatus, default: ChatRoomStatus.OPEN })
  status: ChatRoomStatus;

  @Column({ nullable: true, length: 200 })
  subject: string;

  @Column({ default: 0 })
  messageCount: number;

  @Column({ nullable: true })
  lastMessageAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  roomId: string;

  @Column({ nullable: true })
  senderId: string;

  @Column({ type: 'enum', enum: MessageRole })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
