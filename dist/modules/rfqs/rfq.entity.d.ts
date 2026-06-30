import { User } from '../users/user.entity';
export declare enum RfqStatus {
    OPEN = "open",
    REVIEWING = "reviewing",
    AWARDED = "awarded",
    CANCELED = "canceled"
}
export declare enum BidStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
}
export declare class Rfq {
    id: string;
    userId: string;
    user: User;
    advisorSessionId: string;
    systemSpecs: any;
    address: string;
    city: string;
    state: string;
    timeline: string;
    description: string;
    status: RfqStatus;
    bids: RfqBid[];
    bidCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class RfqBid {
    id: string;
    rfqId: string;
    rfq: Rfq;
    contractorId: string;
    contractor: User;
    hardwareCost: number;
    laborCost: number;
    totalAmount: number;
    proposalText: string;
    status: BidStatus;
    createdAt: Date;
    updatedAt: Date;
}
