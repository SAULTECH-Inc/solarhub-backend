import { RfqsService } from './rfqs.service';
import { User } from '../users/user.entity';
export declare class RfqsController {
    private readonly svc;
    constructor(svc: RfqsService);
    createRfq(uid: string, dto: any): Promise<import("./rfq.entity").Rfq>;
    getMyRfqs(uid: string, p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./rfq.entity").Rfq>>;
    acceptBid(uid: string, bidId: string): Promise<import("./rfq.entity").RfqBid>;
    getOpenRfqs(state?: string, city?: string, p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./rfq.entity").Rfq>>;
    submitBid(user: User, rfqId: string, dto: any): Promise<import("./rfq.entity").RfqBid>;
}
