import { User } from '../users/user.entity';
export declare enum DisputeType {
    ORDER = "order",
    PAYMENT = "payment",
    PRODUCT = "product",
    SERVICE = "service",
    FRAUD = "fraud",
    INQUIRY = "inquiry"
}
export declare enum DisputeCategory {
    ITEM_NOT_RECEIVED = "item_not_received",
    ITEM_NOT_AS_DESCRIBED = "item_not_as_described",
    DAMAGED_ITEM = "damaged_item",
    UNAUTHORIZED_CHARGE = "unauthorized_charge",
    REFUND_NOT_ISSUED = "refund_not_issued",
    DOUBLE_CHARGE = "double_charge",
    SELLER_MISCONDUCT = "seller_misconduct",
    ENGINEER_MISCONDUCT = "engineer_misconduct",
    LOGISTICS_ISSUE = "logistics_issue",
    FAKE_PRODUCT = "fake_product",
    SCAM_ATTEMPT = "scam_attempt",
    OFF_PLATFORM_PAYMENT = "off_platform_payment",
    ACCOUNT_COMPROMISED = "account_compromised",
    FAKE_REVIEW = "fake_review",
    OTHER = "other"
}
export declare enum DisputeStatus {
    OPEN = "open",
    UNDER_REVIEW = "under_review",
    AWAITING_RESPONSE = "awaiting_response",
    RESOLVED = "resolved",
    CLOSED = "closed",
    ESCALATED = "escalated"
}
export declare enum DisputeResolution {
    FULL_REFUND = "full_refund",
    PARTIAL_REFUND = "partial_refund",
    SELLER_FAVOR = "seller_favor",
    DISMISSED = "dismissed",
    WARNING_ISSUED = "warning_issued",
    ACCOUNT_SUSPENDED = "account_suspended",
    LAW_ENFORCEMENT_REFERRED = "law_enforcement_referred"
}
export declare enum DisputePriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class Dispute {
    id: string;
    type: DisputeType;
    category: DisputeCategory;
    status: DisputeStatus;
    priority: DisputePriority;
    resolution: DisputeResolution;
    subject: string;
    description: string;
    respondentResponse: string;
    adminNote: string;
    resolutionNote: string;
    evidence: string[];
    amountDisputed: number;
    claimantId: string;
    claimant: User;
    respondentId: string;
    respondent: User;
    orderId: string;
    paymentId: string;
    productId: string;
    assignedToId: string;
    assignedTo: User;
    resolvedAt: Date;
    respondentDeadline: Date;
    createdAt: Date;
    updatedAt: Date;
}
