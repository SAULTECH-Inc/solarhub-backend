import { DeliveryService } from './delivery.service';
import { DeliveryTracking, TrackingEventType } from './delivery.entity';
export declare class DeliveryController {
    private readonly svc;
    constructor(svc: DeliveryService);
    getTracking(orderId: string): Promise<{
        order: any;
        tracking: DeliveryTracking[];
        currentStatus: TrackingEventType;
        progress: number;
    }>;
    trackByCode(code: string): Promise<any>;
    addEvent(orderId: string, body: {
        event: TrackingEventType;
        description?: string;
        location?: string;
        handlerName?: string;
    }, uid: string): Promise<DeliveryTracking>;
    getStats(): Promise<{
        delivered: number;
        inTransit: number;
        failed: number;
    }>;
}
