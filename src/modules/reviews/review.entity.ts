// review.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('reviews')
@Index(['productId'])
@Index(['userId', 'productId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  orderItemId: string;

  @Column({ type: 'smallint' })
  rating: number; // 1–5

  @Column({ length: 200, nullable: true })
  title: string;

  @Column({ length: 2000, nullable: true })
  body: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ nullable: true, length: 1000 })
  sellerReply: string;

  @Column({ nullable: true })
  sellerRepliedAt: Date;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: 0 })
  helpfulCount: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
