import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryTracking, TrackingEventType } from './delivery.entity';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Order, OrderStatus } from '../orders/order.entity';

const EVENT_LABELS: Record<TrackingEventType, string> = {
  [TrackingEventType.ORDER_PLACED]:      'Order Placed',
  [TrackingEventType.PAYMENT_CONFIRMED]: 'Payment Confirmed',
  [TrackingEventType.PROCESSING]:        'Order Being Processed',
  [TrackingEventType.DISPATCHED]:        'Dispatched from Seller',
  [TrackingEventType.IN_TRANSIT]:        'In Transit',
  [TrackingEventType.ARRIVED_HUB]:       'Arrived at Local Hub',
  [TrackingEventType.OUT_FOR_DELIVERY]:  'Out for Delivery',
  [TrackingEventType.DELIVERED]:         'Delivered',
  [TrackingEventType.FAILED_DELIVERY]:   'Delivery Attempt Failed',
  [TrackingEventType.RETURNED]:          'Returned to Sender',
};

// Maps order status → delivery event
const STATUS_TO_EVENT: Partial<Record<OrderStatus, TrackingEventType>> = {
  [OrderStatus.CONFIRMED]:    TrackingEventType.PAYMENT_CONFIRMED,
  [OrderStatus.PROCESSING]:   TrackingEventType.PROCESSING,
  [OrderStatus.DISPATCHED]:   TrackingEventType.DISPATCHED,
  [OrderStatus.IN_TRANSIT]:   TrackingEventType.IN_TRANSIT,
  [OrderStatus.OUT_DELIVERY]: TrackingEventType.OUT_FOR_DELIVERY,
  [OrderStatus.DELIVERED]:    TrackingEventType.DELIVERED,
};

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(DeliveryTracking)
    private readonly repo: Repository<DeliveryTracking>,
    private readonly orders: OrdersService,
    private readonly notif: NotificationsService,
  ) {}

  // ── Add a tracking event ──────────────────────────────────
  async addEvent(
    orderId: string,
    event: TrackingEventType,
    options?: {
      description?: string;
      location?: string;
      handlerName?: string;
      updatedBy?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<DeliveryTracking> {
    const tracking = this.repo.create({
      orderId,
      event,
      description: options?.description || EVENT_LABELS[event],
      location:    options?.location,
      handlerName: options?.handlerName,
      updatedBy:   options?.updatedBy,
      metadata:    options?.metadata,
    });
    const saved = await this.repo.save(tracking);
    this.logger.log(`Tracking event [${event}] added for order ${orderId}`);
    return saved;
  }

  // ── Sync with order status changes ───────────────────────
  async syncFromOrderStatus(
    order: Order,
    newStatus: OrderStatus,
    updatedBy?: string,
    note?: string,
  ): Promise<void> {
    const event = STATUS_TO_EVENT[newStatus];
    if (!event) return;

    // Avoid duplicate events
    const exists = await this.repo.findOne({
      where: { orderId: order.id, event },
    });
    if (exists) return;

    await this.addEvent(order.id, event, {
      description: note || EVENT_LABELS[event],
      updatedBy,
    });
  }

  // ── Get tracking history ───────────────────────────────────
  async getTrackingHistory(orderId: string): Promise<{
    order: any;
    tracking: DeliveryTracking[];
    currentStatus: TrackingEventType;
    progress: number;
  }> {
    const order = await this.orders.findById(orderId);

    const tracking = await this.repo.find({
      where: { orderId },
      order: { timestamp: 'ASC' },
    });

    const allEvents = Object.values(TrackingEventType).filter(
      e => ![TrackingEventType.FAILED_DELIVERY, TrackingEventType.RETURNED].includes(e),
    );
    const doneEvents = tracking.map(t => t.event);
    const current = doneEvents[doneEvents.length - 1] || TrackingEventType.ORDER_PLACED;
    const progress = Math.round((doneEvents.length / allEvents.length) * 100);

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingCode: order.trackingCode,
        estimatedDelivery: order.estimatedDelivery,
        deliveryAddress: order.deliveryAddress,
      },
      tracking,
      currentStatus: current,
      progress,
    };
  }

  // ── Get by tracking code (public) ─────────────────────────
  async getByTrackingCode(trackingCode: string): Promise<any> {
    // In prod this would join via orders table
    const qb = this.repo.manager
      .getRepository(Order)
      .createQueryBuilder('o')
      .where('o.trackingCode = :code', { code: trackingCode.toUpperCase() });
    const order = await qb.getOne();
    if (!order) throw new NotFoundException('Tracking code not found');
    return this.getTrackingHistory(order.id);
  }

  // ── Bulk status progression (cron / manual) ───────────────
  async autoProgressOrders(): Promise<void> {
    // Called by scheduler to auto-advance demo orders
    this.logger.log('Auto-progressing pending orders...');
  }

  async getDeliveryStats() {
    const delivered = await this.repo.count({
      where: { event: TrackingEventType.DELIVERED },
    });
    const inTransit = await this.repo.count({
      where: { event: TrackingEventType.IN_TRANSIT },
    });
    const failed = await this.repo.count({
      where: { event: TrackingEventType.FAILED_DELIVERY },
    });
    return { delivered, inTransit, failed };
  }
}
