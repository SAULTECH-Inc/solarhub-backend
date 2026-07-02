import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index, BeforeInsert, BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';

export enum UserRole { BUYER = 'buyer', SELLER = 'seller', ADMIN = 'admin', SUPER_ADMIN = 'super_admin' }
export enum AuthProvider { LOCAL = 'local', GOOGLE = 'google' }
export enum UserStatus { ACTIVE = 'active', INACTIVE = 'inactive', SUSPENDED = 'suspended', PENDING = 'pending' }

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100, nullable: true })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ nullable: true, select: false })
  @Exclude()
  password: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.BUYER })
  role: UserRole;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @Column({ nullable: true })
  googleId: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ nullable: true })
  refreshTokenExpiry: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  // ── Dual-role flags ───────────────────────────────────────
  /** User has completed seller onboarding and can list products */
  @Column({ default: false })
  isSeller: boolean;

  /** User has completed engineer onboarding and appears in engineer marketplace */
  @Column({ default: false })
  isEngineer: boolean;

  /** User has registered as a logistics provider */
  @Column({ default: false })
  isLogistics: boolean;

  // ── Seller / Company profile ──────────────────────────────
  @Column({ nullable: true, length: 200 })
  storeName: string;

  @Column({ nullable: true, length: 1000 })
  storeDescription: string;

  @Column({ nullable: true, length: 500 })
  storeBanner: string;

  @Column({ nullable: true, length: 500 })
  storeAddress: string;

  @Column({ nullable: true, length: 200 })
  storeCity: string;

  @Column({ nullable: true, length: 100 })
  storeState: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  storeLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  storeLongitude: number;

  @Column({ nullable: true, length: 50 })
  businessType: string;

  @Column({ nullable: true, length: 200 })
  businessRegNumber: string;

  @Column({ nullable: true, length: 50 })
  taxId: string;

  // ── KYC / Identity (shared by sellers & engineers) ────────
  /** Raw NIN / government-issued ID number */
  @Column({ nullable: true, length: 100 })
  nin: string;

  /** Structured NIN verification data returned from NIMC or provider */
  @Column({ type: 'jsonb', nullable: true })
  ninData: Record<string, any>;

  @Column({ nullable: true, length: 50 })
  govtIdType: string;   // e.g. 'NIN', 'BVN', 'Passport', "Driver's Licence", 'Voter Card'

  @Column({ nullable: true, length: 500 })
  govtIdUrl: string;    // uploaded scan/photo URL

  /** All required KYC fields for seller have been provided */
  @Column({ default: false })
  sellerProfileComplete: boolean;

  @Column({ default: false })
  sellerVerified: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  sellerRating: number;

  @Column({ default: 0 })
  totalSales: number;

  @Column({ default: 0 })
  totalOrders: number;

  // ── Monetization / Subscriptions ──────────────────────────
  @Column({ default: 'free', length: 50 })
  subscriptionTier: string; // 'free', 'pro'

  @Column({ default: 'none', length: 50 })
  subscriptionStatus: string; // 'none', 'trialing', 'active', 'past_due', 'canceled'

  @Column({ nullable: true })
  trialEndsAt: Date;

  @Column({ nullable: true })
  subscriptionExpiresAt: Date;

  // Notification preferences
  @Column({ type: 'jsonb', default: { email: true, sms: true, push: true } })
  notificationPrefs: { email: boolean; sms: boolean; push: boolean };

  /** Public contact / social links (shown on seller / engineer profile pages) */
  @Column({ type: 'jsonb', nullable: true })
  socialLinks: {
    whatsapp?:  string;
    instagram?: string;
    facebook?:  string;
    twitter?:   string;
  };

  // Address book
  @Column({ type: 'jsonb', default: [] })
  addresses: Array<{
    id: string;
    label: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    isDefault: boolean;
  }>;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ nullable: true })
  lockoutUntil: Date;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpiry: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Hooks ─────────────────────────────────────────────────
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(plain: string): Promise<boolean> {
    return this.password ? bcrypt.compare(plain, this.password) : false;
  }

  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }

  get isLocked(): boolean {
    return this.lockoutUntil ? new Date() < this.lockoutUntil : false;
  }
}
