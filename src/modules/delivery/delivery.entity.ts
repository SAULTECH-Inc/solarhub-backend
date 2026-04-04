import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

export enum TrackingEventType {
  ORDER_PLACED      = 'order_placed',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PROCESSING        = 'processing',
  DISPATCHED        = 'dispatched',
  IN_TRANSIT        = 'in_transit',
  ARRIVED_HUB       = 'arrived_hub',
  OUT_FOR_DELIVERY  = 'out_for_delivery',
  DELIVERED         = 'delivered',
  FAILED_DELIVERY   = 'failed_delivery',
  RETURNED          = 'returned',
}

@Entity('delivery_tracking')
export class DeliveryTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  orderId: string;

  @Column({ type: 'enum', enum: TrackingEventType })
  event: TrackingEventType;

  @Column({ length: 300 })
  description: string;

  @Column({ nullable: true, length: 200 })
  location: string;

  @Column({ nullable: true, length: 200 })
  handlerName: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}
