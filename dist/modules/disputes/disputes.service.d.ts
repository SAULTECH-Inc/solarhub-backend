import { Repository } from 'typeorm';
import { Dispute, DisputeStatus, DisputeResolution, DisputePriority, DisputeType, DisputeCategory } from './dispute.entity';
export interface CreateDisputeDto {
    type: DisputeType;
    category: DisputeCategory;
    subject: string;
    description: string;
    orderId?: string;
    paymentId?: string;
    productId?: string;
    respondentId?: string;
    amountDisputed?: number;
    evidence?: string[];
}
export declare class DisputesService {
    private readonly repo;
    constructor(repo: Repository<Dispute>);
    create(claimantId: string, dto: CreateDisputeDto): Promise<Dispute>;
    getMyDisputes(userId: string, page: number, limit: number): Promise<import("@common/utils/pagination.util").PaginatedResult<Dispute>>;
    getById(id: string, userId?: string): Promise<Dispute>;
    addResponse(id: string, userId: string, response: string): Promise<Dispute>;
    adminListAll(page: number, limit: number, filters: {
        status?: string;
        type?: string;
        priority?: string;
        search?: string;
    }): Promise<import("@common/utils/pagination.util").PaginatedResult<Dispute>>;
    adminGetById(id: string): Promise<Dispute>;
    adminUpdateStatus(id: string, status: DisputeStatus, adminNote?: string, assignedToId?: string): Promise<Dispute>;
    adminResolve(id: string, resolution: DisputeResolution, resolutionNote: string): Promise<Dispute>;
    adminSetPriority(id: string, priority: DisputePriority): Promise<Dispute>;
    getStats(): Promise<{
        total: number;
        open: number;
        underReview: number;
        awaitingResponse: number;
        resolved: number;
        escalated: number;
        closed: number;
    }>;
}
