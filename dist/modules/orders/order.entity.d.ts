import { User } from '../users/user.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    DISPATCHED = "dispatched",
    IN_TRANSIT = "in_transit",
    OUT_DELIVERY = "out_delivery",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare class Order {
    id: string;
    orderNumber: string;
    buyerId: string;
    buyer: User;
    items: OrderItem[];
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    currency: string;
    deliveryAddress: {
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        country: string;
        landmark?: string;
    };
    deliveryMethod: string;
    estimatedDelivery: Date;
    trackingCode: string;
    paymentReference: string;
    paymentGateway: string;
    paymentMethod: string;
    statusHistory: Array<{
        status: string;
        timestamp: string;
        note?: string;
        updatedBy?: string;
    }>;
    cancelReason: string;
    cancelledAt: Date;
    deliveredAt: Date;
    buyerNote: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class OrderItem {
    id: string;
    orderId: string;
    productId: string;
    sellerId: string;
    productName: string;
    productImage: string;
    productSlug: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    status: OrderStatus;
    order: Order;
    reviewed: boolean;
    createdAt: Date;
}
