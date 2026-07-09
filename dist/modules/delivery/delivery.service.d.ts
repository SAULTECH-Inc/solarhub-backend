import { Repository } from 'typeorm';
import { DeliveryTracking, TrackingEventType } from './delivery.entity';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Order, OrderStatus } from '../orders/order.entity';
export declare class DeliveryService {
    private readonly repo;
    private readonly orders;
    private readonly notif;
    private readonly logger;
    constructor(repo: Repository<DeliveryTracking>, orders: OrdersService, notif: NotificationsService);
    addEvent(orderId: string, event: TrackingEventType, options?: {
        description?: string;
        location?: string;
        handlerName?: string;
        updatedBy?: string;
        metadata?: Record<string, any>;
    }): Promise<DeliveryTracking>;
    syncFromOrderStatus(order: Order, newStatus: OrderStatus, updatedBy?: string, note?: string): Promise<void>;
    getTrackingHistory(orderId: string): Promise<{
        order: any;
        tracking: DeliveryTracking[];
        currentStatus: TrackingEventType;
        progress: number;
    }>;
    getByTrackingCode(trackingCode: string): Promise<any>;
    autoProgressOrders(): Promise<void>;
    getDeliveryStats(): Promise<{
        delivered: number;
        inTransit: number;
        failed: number;
    }>;
}
