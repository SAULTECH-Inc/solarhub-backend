export declare enum EscrowStatus {
    PENDING_AGREEMENT = "pending_agreement",
    AWAITING_PAYMENT = "awaiting_payment",
    FUNDED = "funded",
    SHIPPED = "shipped",
    COMPLETED = "completed",
    DISPUTED = "disputed",
    REFUNDED = "refunded",
    CANCELLED = "cancelled"
}
export declare enum EscrowCompletionReason {
    BUYER_CONFIRMED = "buyer_confirmed",
    AUTO_RELEASED = "auto_released",
    ADMIN_DECISION = "admin_decision"
}
export declare class EscrowTransaction {
    id: string;
    reference: string;
    orderId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    feePercent: number;
    feeAmount: number;
    sellerAmount: number;
    currency: string;
    status: EscrowStatus;
    paymentReference: string;
    paymentProvider: string;
    transferReference: string;
    sellerBankAccountId: string;
    trackingInfo: {
        carrier?: string;
        trackingNumber?: string;
        trackingUrl?: string;
        note?: string;
    };
    disputeId: string;
    autoReleaseAt: Date;
    completionReason: EscrowCompletionReason;
    adminNote: string;
    cancelReason: string;
    sellerAgreedAt: Date;
    sellerDeclinedAt: Date;
    fundedAt: Date;
    shippedAt: Date;
    confirmedAt: Date;
    releasedAt: Date;
    cancelledAt: Date;
    disputedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
