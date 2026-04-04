// ── Entity ────────────────────────────────────────────────
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Tree, TreeParent, TreeChildren,
} from 'typeorm';

@Entity('categories')
@Tree('closure-table')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ unique: true, length: 120 })
  slug: string;

  @Column({ nullable: true, length: 500 })
  description: string;

  @Column({ nullable: true, length: 10 })
  icon: string;

  @Column({ nullable: true, length: 500 })
  image: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  // Solar-specific spec schema — defines which fields appear on listing form
  @Column({ type: 'jsonb', nullable: true })
  specSchema: Record<string, {
    label: string;
    type: 'text' | 'number' | 'select' | 'multiselect';
    unit?: string;
    options?: string[];
    required: boolean;
    group?: string;
  }>;

  @TreeParent()
  parent: Category;

  @TreeChildren()
  children: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
