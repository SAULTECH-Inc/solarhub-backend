import {
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum InvoiceStatus { PENDING = 'pending', PAID = 'paid', FAILED = 'failed' }

@Entity('subscription_invoices')
@Index(['userId'])
@Index(['reference'], { unique: true })
export class SubscriptionInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ length: 50 })
  plan: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ length: 20, default: 'paystack' })
  provider: string;

  @Column({ unique: true, length: 100 })
  reference: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ nullable: true, length: 200 })
  gatewayTransactionId: string;

  @Column({ nullable: true })
  paidAt: Date;

  /** Start of the billing period this invoice covers */
  @Column({ nullable: true })
  periodStart: Date;

  /** End of the billing period (periodStart + 30 days for monthly) */
  @Column({ nullable: true })
  periodEnd: Date;

  @Column({ type: 'jsonb', nullable: true })
  gatewayData: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
