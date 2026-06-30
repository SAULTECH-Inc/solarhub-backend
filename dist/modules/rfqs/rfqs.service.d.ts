import { Repository } from 'typeorm';
import { Rfq, RfqBid } from './rfq.entity';
import { User } from '../users/user.entity';
export declare class RfqsService {
    private readonly rfqRepo;
    private readonly bidRepo;
    constructor(rfqRepo: Repository<Rfq>, bidRepo: Repository<RfqBid>);
    createRfq(userId: string, dto: Partial<Rfq>): Promise<Rfq>;
    getMyRfqs(userId: string, page: number, limit: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<Rfq>>;
    acceptBid(userId: string, bidId: string): Promise<RfqBid>;
    getOpenRfqs(state?: string, city?: string, page?: number, limit?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<Rfq>>;
    submitBid(contractor: User, rfqId: string, dto: Partial<RfqBid>): Promise<RfqBid>;
}
