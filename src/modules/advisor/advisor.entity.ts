import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

@Entity('advisor_sessions')
export class AdvisorSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'jsonb' })
  appliances: Array<{
    name: string;
    watts: number;
    quantity: number;
    hoursPerDay: number;
    unit: string;
  }>;

  @Column({ type: 'jsonb' })
  preferences: {
    location: string;
    sunHours: number;
    backupFactor: number;
    gridSituation: string;
    priority: string;
  };

  @Column({ type: 'jsonb' })
  results: {
    adjustedDailyLoad: number;
    peakLoad: number;
    recommendations: any[];
  };

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  totalWh: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  peakWatts: number;

  @Column({ nullable: true })
  selectedRecommendation: string;

  @CreateDateColumn()
  createdAt: Date;
}
