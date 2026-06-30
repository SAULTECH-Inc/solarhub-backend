export declare enum InvoiceStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed"
}
export declare class SubscriptionInvoice {
    id: string;
    userId: string;
    plan: string;
    amount: number;
    currency: string;
    provider: string;
    reference: string;
    status: InvoiceStatus;
    gatewayTransactionId: string;
    paidAt: Date;
    periodStart: Date;
    periodEnd: Date;
    gatewayData: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
