import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum DisputeType {
  ORDER    = 'order',
  PAYMENT  = 'payment',
  PRODUCT  = 'product',
  SERVICE  = 'service',
  FRAUD    = 'fraud',
  INQUIRY  = 'inquiry',
}

export enum DisputeCategory {
  ITEM_NOT_RECEIVED     = 'item_not_received',
  ITEM_NOT_AS_DESCRIBED = 'item_not_as_described',
  DAMAGED_ITEM          = 'damaged_item',
  UNAUTHORIZED_CHARGE   = 'unauthorized_charge',
  REFUND_NOT_ISSUED     = 'refund_not_issued',
  DOUBLE_CHARGE         = 'double_charge',
  SELLER_MISCONDUCT     = 'seller_misconduct',
  ENGINEER_MISCONDUCT   = 'engineer_misconduct',
  LOGISTICS_ISSUE       = 'logistics_issue',
  FAKE_PRODUCT          = 'fake_product',
  SCAM_ATTEMPT          = 'scam_attempt',
  OFF_PLATFORM_PAYMENT  = 'off_platform_payment',
  ACCOUNT_COMPROMISED   = 'account_compromised',
  FAKE_REVIEW           = 'fake_review',
  OTHER                 = 'other',
}

export enum DisputeStatus {
  OPEN              = 'open',
  UNDER_REVIEW      = 'under_review',
  AWAITING_RESPONSE = 'awaiting_response',
  RESOLVED          = 'resolved',
  CLOSED            = 'closed',
  ESCALATED         = 'escalated',
}

export enum DisputeResolution {
  FULL_REFUND              = 'full_refund',
  PARTIAL_REFUND           = 'partial_refund',
  SELLER_FAVOR             = 'seller_favor',
  DISMISSED                = 'dismissed',
  WARNING_ISSUED           = 'warning_issued',
  ACCOUNT_SUSPENDED        = 'account_suspended',
  LAW_ENFORCEMENT_REFERRED = 'law_enforcement_referred',
}

export enum DisputePriority {
  LOW    = 'low',
  NORMAL = 'normal',
  HIGH   = 'high',
  URGENT = 'urgent',
}

@Entity('disputes')
@Index(['claimantId'])
@Index(['status'])
@Index(['type'])
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: DisputeType })
  type: DisputeType;

  @Column({ type: 'enum', enum: DisputeCategory })
  category: DisputeCategory;

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column({ type: 'enum', enum: DisputePriority, default: DisputePriority.NORMAL })
  priority: DisputePriority;

  @Column({ type: 'enum', enum: DisputeResolution, nullable: true })
  resolution: DisputeResolution;

  @Column({ length: 200 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  respondentResponse: string;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @Column({ type: 'text', nullable: true })
  resolutionNote: string;

  @Column({ type: 'simple-array', nullable: true })
  evidence: string[];

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amountDisputed: number;

  @Column()
  claimantId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'claimantId' })
  claimant: User;

  @Column({ nullable: true })
  respondentId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'respondentId' })
  respondent: User;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondentDeadline: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
