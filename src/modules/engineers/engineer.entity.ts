import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum EngineerStatus {
  ACTIVE    = 'active',
  SUSPENDED = 'suspended',
  FLAGGED   = 'flagged',
}

@Entity('engineers')
@Index(['userId'], { unique: true })
export class Engineer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // ── Identity ──────────────────────────────────────────────
  /** Full legal name (may differ from account firstName/lastName) */
  @Column({ length: 200 })
  fullName: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  /** Raw NIN / govt ID number */
  @Column({ length: 100 })
  nin: string;

  /** Structured NIN/NIMC data (optional – populated if verified via API) */
  @Column({ type: 'jsonb', nullable: true })
  ninData: Record<string, any>;

  @Column({ length: 50 })
  govtIdType: string; // 'NIN' | 'BVN' | 'Passport' | "Driver's Licence" | 'Voter Card'

  /** URL of uploaded ID document scan (optional) */
  @Column({ nullable: true, length: 500 })
  govtIdUrl: string;

  // ── Location ──────────────────────────────────────────────
  @Column({ length: 500 })
  address: string;

  @Column({ length: 200 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column({ length: 100, default: 'Nigeria' })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  /** Max distance (km) engineer is willing to travel for jobs */
  @Column({ type: 'int', default: 50 })
  serviceRadiusKm: number;

  // ── Professional ──────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true, length: 500 })
  profilePhoto: string;

  @Column({ type: 'int', default: 0 })
  yearsOfExperience: number;

  /**
   * jsonb array of specialization strings, e.g.:
   * ['Solar Panel Installation', 'Battery Systems', 'Inverter Setup', 'Off-Grid Systems']
   */
  @Column({ type: 'jsonb', default: [] })
  specializations: string[];

  /**
   * jsonb array of certification objects:
   * [{ name: 'NABCEP PVIP', issuer: 'NABCEP', year: 2022, url: '...' }]
   */
  @Column({ type: 'jsonb', default: [] })
  certifications: Array<{
    name: string;
    issuer: string;
    year?: number;
    url?: string;
  }>;

  @Column({ default: true })
  availableForHire: boolean;

  /** Public contact / social links */
  @Column({ type: 'jsonb', nullable: true })
  socialLinks: {
    whatsapp?:  string; // phone with country code, no +
    instagram?: string; // handle without @
    facebook?:  string; // handle or profile url
    twitter?:   string; // handle without @
  };

  // ── Status & Reviews ──────────────────────────────────────
  @Column({ type: 'enum', enum: EngineerStatus, default: EngineerStatus.ACTIVE })
  status: EngineerStatus;

  @Column({ nullable: true, type: 'text' })
  adminNote: string; // internal note from admin when flagging/suspending

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: 0 })
  completedJobs: number;

  /** Whether admin has manually verified this engineer's credentials */
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
