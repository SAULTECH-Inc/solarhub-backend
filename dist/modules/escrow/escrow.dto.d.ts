export declare class RegisterBankAccountDto {
    bankCode: string;
    accountNumber: string;
}
export declare class SellerRespondDto {
    decision: 'accept' | 'decline';
    reason?: string;
}
export declare class FundEscrowDto {
    currency: string;
    email: string;
}
export declare class MarkShippedDto {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    note?: string;
}
export declare class RaiseDisputeDto {
    reason: string;
    evidence?: string[];
}
export declare class ResolveDisputeDto {
    decision: 'release' | 'refund';
    note: string;
}
