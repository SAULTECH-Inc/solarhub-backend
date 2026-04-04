import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';

export enum RfqStatus {
  OPEN = 'open',
  REVIEWING = 'reviewing',
  AWARDED = 'awarded',
  CANCELED = 'canceled'
}

export enum BidStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

@Entity('rfqs')
export class Rfq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  advisorSessionId: string;

  // Store the actual technical spec so Engineers don't need to fetch the session separately
  @Column({ type: 'jsonb', nullable: true })
  systemSpecs: any;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column({ nullable: true })
  timeline: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: RfqStatus, default: RfqStatus.OPEN })
  status: RfqStatus;

  @OneToMany(() => RfqBid, bid => bid.rfq)
  bids: RfqBid[];

  @Column({ default: 0 })
  bidCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('rfq_bids')
export class RfqBid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rfqId: string;

  @ManyToOne(() => Rfq, rfq => rfq.bids, { onDelete: 'CASCADE' })
  rfq: Rfq;

  @Column()
  contractorId: string;

  @ManyToOne(() => User)
  contractor: User;

  @Column({ type: 'numeric' })
  hardwareCost: number;

  @Column({ type: 'numeric' })
  laborCost: number;

  @Column({ type: 'numeric' })
  totalAmount: number;

  @Column({ type: 'text' })
  proposalText: string;

  @Column({ type: 'enum', enum: BidStatus, default: BidStatus.PENDING })
  status: BidStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
