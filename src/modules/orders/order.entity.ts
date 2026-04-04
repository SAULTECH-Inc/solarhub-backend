import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum OrderStatus {
  PENDING       = 'pending',
  CONFIRMED     = 'confirmed',
  PROCESSING    = 'processing',
  DISPATCHED    = 'dispatched',
  IN_TRANSIT    = 'in_transit',
  OUT_DELIVERY  = 'out_delivery',
  DELIVERED     = 'delivered',
  CANCELLED     = 'cancelled',
  REFUNDED      = 'refunded',
}

export enum PaymentStatus {
  PENDING   = 'pending',
  PAID      = 'paid',
  FAILED    = 'failed',
  REFUNDED  = 'refunded',
}

@Entity('orders')
@Index(['buyerId'])
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  orderNumber: string;

  @Column()
  buyerId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  total: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'jsonb' })
  deliveryAddress: {
    firstName: string; lastName: string; phone: string;
    address: string; city: string; state: string; country: string;
    landmark?: string;
  };

  @Column({ length: 50, default: 'standard' })
  deliveryMethod: string;

  @Column({ nullable: true })
  estimatedDelivery: Date;

  @Column({ nullable: true, length: 20 })
  trackingCode: string;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true, length: 50 })
  paymentGateway: string;

  @Column({ type: 'jsonb', default: [] })
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }>;

  @Column({ nullable: true, length: 500 })
  cancelReason: string;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true, length: 500 })
  buyerNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  productId: string;

  @Column()
  sellerId: string;

  @Column({ length: 300 })
  productName: string;

  @Column({ nullable: true, length: 500 })
  productImage: string;

  @Column({ nullable: true, length: 120 })
  productSlug: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  unitPrice: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ManyToOne(() => Order, o => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ default: false })
  reviewed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
