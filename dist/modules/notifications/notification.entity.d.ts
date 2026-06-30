export declare enum NotificationType {
    ORDER_PLACED = "order_placed",
    ORDER_CONFIRMED = "order_confirmed",
    ORDER_SHIPPED = "order_shipped",
    ORDER_DELIVERED = "order_delivered",
    PAYMENT_SUCCESS = "payment_success",
    PAYMENT_FAILED = "payment_failed",
    PRODUCT_APPROVED = "product_approved",
    NEW_MESSAGE = "new_message",
    REVIEW_RECEIVED = "review_received",
    PRICE_DROP = "price_drop",
    SYSTEM = "system"
}
export declare class Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, any>;
    read: boolean;
    readAt: Date;
    createdAt: Date;
}
