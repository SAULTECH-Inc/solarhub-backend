export declare enum PaymentProvider {
    PAYSTACK = "paystack",
    STRIPE = "stripe",
    FLUTTERWAVE = "flutterwave",
    PADDLE = "paddle"
}
export declare enum PaymentMethod {
    CARD = "card",
    TRANSFER = "bank_transfer",
    USSD = "ussd",
    MOBILE_MONEY = "mobile_money",
    CASH = "cash"
}
export declare enum TxStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded",
    CANCELLED = "cancelled"
}
export declare class Payment {
    id: string;
    orderId: string;
    userId: string;
    reference: string;
    amount: number;
    currency: string;
    provider: PaymentProvider;
    method: PaymentMethod;
    status: TxStatus;
    gatewayTransactionId: string;
    paidAt: Date;
    failureReason: string;
    metadata: Record<string, any>;
    refundAmount: number;
    refundedAt: Date;
    refundReason: string;
    createdAt: Date;
    updatedAt: Date;
}
