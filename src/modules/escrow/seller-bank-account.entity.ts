import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('seller_bank_accounts')
@Index(['sellerId'])
export class SellerBankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sellerId: string;

  @Column({ length: 100 })
  bankName: string;

  @Column({ length: 10 })
  bankCode: string;

  @Column({ length: 20 })
  accountNumber: string;

  @Column({ length: 200 })
  accountName: string;

  // Paystack recipient code — created once, reused for all transfers to this account
  @Column({ nullable: true, length: 50 })
  recipientCode: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
