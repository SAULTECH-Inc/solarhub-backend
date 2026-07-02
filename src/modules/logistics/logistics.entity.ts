import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum ProviderType {
  INDIVIDUAL = 'individual',
  COMPANY    = 'company',
}

export enum ProviderStatus {
  PENDING   = 'pending',
  ACTIVE    = 'active',
  SUSPENDED = 'suspended',
}

export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  CAR        = 'car',
  VAN        = 'van',
  TRUCK      = 'truck',
  BICYCLE    = 'bicycle',
  OTHER      = 'other',
}

export enum ShipmentStatus {
  PENDING    = 'pending',
  ACCEPTED   = 'accepted',
  REJECTED   = 'rejected',
  PICKED_UP  = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED  = 'delivered',
  FAILED     = 'failed',
}

// ── LogisticsProvider ─────────────────────────────────────────────────────────

@Entity('logistics_providers')
@Index(['userId'], { unique: true })
export class LogisticsProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ProviderType })
  type: ProviderType;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true, length: 1000 })
  description: string;

  @Column({ nullable: true, length: 500 })
  logo: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  email: string;

  @Column({ nullable: true, length: 300 })
  address: string;

  @Column({ nullable: true, length: 100 })
  city: string;

  @Column({ nullable: true, length: 100 })
  state: string;

  @Column({ type: 'jsonb', default: [] })
  coverageStates: string[];

  @Column({ type: 'jsonb', default: [] })
  coverageCities: string[];

  @Column({ type: 'jsonb', default: [] })
  vehicleTypes: string[];

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  baseRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  ratePerKm: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxWeightKg: number;

  @Column({ type: 'enum', enum: ProviderStatus, default: ProviderStatus.PENDING })
  status: ProviderStatus;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalDeliveries: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @Column({ nullable: true, length: 200 })
  businessRegNumber: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ── LogisticsAgent ────────────────────────────────────────────────────────────

@Entity('logistics_agents')
@Index(['providerId'])
export class LogisticsAgent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ nullable: true, length: 255 })
  email: string;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.MOTORCYCLE })
  vehicleType: VehicleType;

  @Column({ nullable: true, length: 50 })
  vehicleNumber: string;

  @Column({ type: 'jsonb', default: [] })
  coverageAreas: string[];

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  totalDeliveries: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ── ShipmentAssignment ────────────────────────────────────────────────────────

export interface PickupAddress {
  address:     string;
  city:        string;
  state:       string;
  phone:       string;
  contactName: string;
}

export interface StatusHistoryEntry {
  status:     ShipmentStatus;
  timestamp:  string;
  note?:      string;
  updatedBy?: string;
  location?:  string;
}

@Entity('shipment_assignments')
@Index(['orderId'],    { unique: true })
@Index(['providerId'])
@Index(['sellerId'])
export class ShipmentAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @Column()
  sellerId: string;

  @Column()
  providerId: string;

  @Column({ nullable: true })
  agentId: string;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  @Column({ type: 'jsonb' })
  pickupAddress: PickupAddress;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  agreedRate: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ nullable: true })
  estimatedPickup: Date;

  @Column({ nullable: true })
  estimatedDelivery: Date;

  @Column({ nullable: true })
  actualPickup: Date;

  @Column({ nullable: true })
  actualDelivery: Date;

  @Column({ nullable: true, length: 500 })
  rejectionReason: string;

  @Column({ nullable: true, length: 500 })
  proofOfDelivery: string;

  @Column({ nullable: true, length: 1000 })
  sellerNote: string;

  @Column({ nullable: true, length: 1000 })
  providerNote: string;

  @Column({ type: 'jsonb', default: [] })
  statusHistory: StatusHistoryEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
