import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum EscrowStatus {
  PENDING_AGREEMENT = 'pending_agreement', // buyer requested, waiting for seller
  AWAITING_PAYMENT  = 'awaiting_payment',  // seller agreed, buyer needs to pay
  FUNDED            = 'funded',            // buyer paid — money held on platform
  SHIPPED           = 'shipped',           // seller marked goods as shipped
  COMPLETED         = 'completed',         // funds released to seller (confirmed or auto-released)
  DISPUTED          = 'disputed',          // buyer raised a dispute
  REFUNDED          = 'refunded',          // funds returned to buyer
  CANCELLED         = 'cancelled',         // seller declined or either party cancelled before funding
}

export enum EscrowCompletionReason {
  BUYER_CONFIRMED = 'buyer_confirmed',
  AUTO_RELEASED   = 'auto_released',
  ADMIN_DECISION  = 'admin_decision',
}

@Entity('escrow_transactions')
@Index(['orderId'], { unique: true }) // one escrow per order
@Index(['buyerId'])
@Index(['sellerId'])
@Index(['status'])
export class EscrowTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  reference: string;

  @Column()
  orderId: string;

  @Column()
  buyerId: string;

  @Column()
  sellerId: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.5 })
  feePercent: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  feeAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  sellerAmount: number; // amount - feeAmount

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.PENDING_AGREEMENT })
  status: EscrowStatus;

  // Payment details (when buyer funds escrow)
  @Column({ nullable: true, length: 100 })
  paymentReference: string;

  @Column({ nullable: true, length: 30 })
  paymentProvider: string;

  // Payout details (when funds released to seller)
  @Column({ nullable: true, length: 100 })
  transferReference: string;

  @Column({ nullable: true })
  sellerBankAccountId: string;

  // Shipping info provided by seller
  @Column({ type: 'jsonb', nullable: true })
  trackingInfo: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    note?: string;
  };

  // Dispute reference (links to existing disputes table)
  @Column({ nullable: true })
  disputeId: string;

  // Auto-release scheduled for this date (set when status → SHIPPED)
  @Column({ nullable: true })
  autoReleaseAt: Date;

  // How completion was triggered
  @Column({ type: 'enum', enum: EscrowCompletionReason, nullable: true })
  completionReason: EscrowCompletionReason;

  // Admin override note (dispute resolution, manual intervention)
  @Column({ type: 'text', nullable: true })
  adminNote: string;

  // Cancel reason
  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  // Timestamps for key events
  @Column({ nullable: true }) sellerAgreedAt: Date;
  @Column({ nullable: true }) sellerDeclinedAt: Date;
  @Column({ nullable: true }) fundedAt: Date;
  @Column({ nullable: true }) shippedAt: Date;
  @Column({ nullable: true }) confirmedAt: Date;
  @Column({ nullable: true }) releasedAt: Date;
  @Column({ nullable: true }) cancelledAt: Date;
  @Column({ nullable: true }) disputedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
