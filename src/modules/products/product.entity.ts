import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, Index, OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';

export enum ProductStatus { ACTIVE='active', INACTIVE='inactive', PENDING='pending', SOLD_OUT='sold_out', DELETED='deleted' }
export enum ProductCondition { NEW='new', USED_LIKE_NEW='used_like_new', USED_GOOD='used_good', REFURBISHED='refurbished' }
export enum DeliveryPayer { SELLER='seller', BUYER='buyer', SHARED='shared', NEGOTIABLE='negotiable' }
export enum PaymentTerm { ESCROW='escrow', BEFORE_DELIVERY='before_delivery', ON_DELIVERY='on_delivery', AFTER_INSPECTION='after_inspection', INSTALLMENT='installment' }

@Entity('products')
@Index(['status', 'categoryId'])
@Index(['sellerId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  name: string;

  @Column({ unique: true, length: 320 })
  slug: string;

  @Column({ length: 2000, nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  // Price in other currencies (cached on save)
  @Column({ type: 'jsonb', nullable: true })
  prices: { NGN?: number; USD?: number; CNY?: number; GHS?: number };

  @Column({ default: 0 })
  stock: number;

  @Column({ type: 'enum', enum: ProductCondition, default: ProductCondition.NEW })
  condition: ProductCondition;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.PENDING })
  status: ProductStatus;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ length: 150, nullable: true })
  modelNumber: string;

  @Column({ nullable: true })
  warrantyYears: number;

  @Column({ length: 200, nullable: true })
  sellerCity: string;

  @Column({ length: 100, nullable: true })
  sellerState: string;

  // Delivery info
  @Column({ default: 3 })
  deliveryDays: number;

  @Column({ type: 'enum', enum: DeliveryPayer, default: DeliveryPayer.BUYER })
  shippingPayer: DeliveryPayer;

  @Column({ length: 200, nullable: true })
  serviceAreas: string;

  @Column({ type: 'simple-array', nullable: true })
  paymentTerms: string[];

  @Column({ length: 100, nullable: true })
  returnPolicy: string;

  // Images stored as Cloudinary URLs
  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ nullable: true, length: 500 })
  thumbnail: string;

  // Deep specs as flexible JSONB (per category schema)
  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, any>;

  // Bulk / volume discount rules
  // e.g. [{ type: 'percentage', minQty: 10, value: 10 }, { type: 'free_unit', minQty: 100, value: 1 }]
  @Column({ type: 'jsonb', nullable: true })
  discounts: Array<{ type: 'percentage' | 'fixed' | 'free_unit'; minQty: number; value: number }>;

  // Analytics
  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  salesCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: false })
  featured: boolean;

  @Column({ nullable: true, length: 100 })
  badge: string;

  // Search vector for full-text search
  @Column({ type: 'tsvector', select: false, nullable: true })
  searchVector: any;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  sellerId: string;

  @ManyToOne(() => Category, { eager: false, nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
