import { EscrowService } from './escrow.service';
import { RegisterBankAccountDto, SellerRespondDto, FundEscrowDto, MarkShippedDto, RaiseDisputeDto, ResolveDisputeDto } from './escrow.dto';
export declare class EscrowController {
    private readonly svc;
    constructor(svc: EscrowService);
    registerBankAccount(req: any, dto: RegisterBankAccountDto): Promise<import("./seller-bank-account.entity").SellerBankAccount>;
    getBankAccounts(req: any): Promise<import("./seller-bank-account.entity").SellerBankAccount[]>;
    initiate(req: any, orderId: string, sellerId: string, amount: number, currency: string): Promise<import("./escrow.entity").EscrowTransaction>;
    sellerRespond(req: any, id: string, dto: SellerRespondDto): Promise<import("./escrow.entity").EscrowTransaction>;
    fundEscrow(req: any, id: string, dto: FundEscrowDto): Promise<{
        provider: string;
        reference: string;
        paymentUrl: string;
    }>;
    verifyFunding(reference: string): Promise<import("./escrow.entity").EscrowTransaction>;
    markShipped(req: any, id: string, dto: MarkShippedDto): Promise<import("./escrow.entity").EscrowTransaction>;
    confirmDelivery(req: any, id: string): Promise<import("./escrow.entity").EscrowTransaction>;
    raiseDispute(req: any, id: string, dto: RaiseDisputeDto): Promise<import("./escrow.entity").EscrowTransaction>;
    getByOrder(orderId: string): Promise<import("./escrow.entity").EscrowTransaction>;
    myBuyerEscrows(req: any, p?: number, l?: number): Promise<{
        data: import("./escrow.entity").EscrowTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    mySellerEscrows(req: any, p?: number, l?: number): Promise<{
        data: import("./escrow.entity").EscrowTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getOne(id: string): Promise<import("./escrow.entity").EscrowTransaction>;
    listAll(p?: number, l?: number, status?: string): Promise<{
        data: import("./escrow.entity").EscrowTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    resolveDispute(id: string, dto: ResolveDisputeDto): Promise<import("./escrow.entity").EscrowTransaction>;
    adminCancel(id: string, reason: string): Promise<import("./escrow.entity").EscrowTransaction>;
}
