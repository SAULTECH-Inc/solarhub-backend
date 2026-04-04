import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

export enum NotificationType {
  ORDER_PLACED     = 'order_placed',
  ORDER_CONFIRMED  = 'order_confirmed',
  ORDER_SHIPPED    = 'order_shipped',
  ORDER_DELIVERED  = 'order_delivered',
  PAYMENT_SUCCESS  = 'payment_success',
  PAYMENT_FAILED   = 'payment_failed',
  PRODUCT_APPROVED = 'product_approved',
  NEW_MESSAGE      = 'new_message',
  REVIEW_RECEIVED  = 'review_received',
  PRICE_DROP       = 'price_drop',
  SYSTEM           = 'system',
}

@Entity('notifications')
@Index(['userId', 'read'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 1000 })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
