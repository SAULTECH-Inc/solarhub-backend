import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum PaymentProvider { PAYSTACK='paystack', STRIPE='stripe', FLUTTERWAVE='flutterwave', PADDLE='paddle' }
export enum PaymentMethod   { CARD='card', TRANSFER='bank_transfer', USSD='ussd', MOBILE_MONEY='mobile_money', CASH='cash' }
export enum TxStatus        { PENDING='pending', SUCCESS='success', FAILED='failed', REFUNDED='refunded', CANCELLED='cancelled' }

@Entity('payments')
@Index(['orderId'])
@Index(['reference'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  userId: string;

  @Column({ unique: true, length: 100 })
  reference: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: TxStatus, default: TxStatus.PENDING })
  status: TxStatus;

  @Column({ nullable: true, length: 200 })
  gatewayTransactionId: string;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true, length: 500 })
  failureReason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Refund info
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ nullable: true })
  refundedAt: Date;

  @Column({ nullable: true, length: 500 })
  refundReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
