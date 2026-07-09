export declare enum TrackingEventType {
    ORDER_PLACED = "order_placed",
    PAYMENT_CONFIRMED = "payment_confirmed",
    PROCESSING = "processing",
    DISPATCHED = "dispatched",
    IN_TRANSIT = "in_transit",
    ARRIVED_HUB = "arrived_hub",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    FAILED_DELIVERY = "failed_delivery",
    RETURNED = "returned"
}
export declare class DeliveryTracking {
    id: string;
    orderId: string;
    event: TrackingEventType;
    description: string;
    location: string;
    handlerName: string;
    updatedBy: string;
    metadata: Record<string, any>;
    timestamp: Date;
}
