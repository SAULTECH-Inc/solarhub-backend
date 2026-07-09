import { DisputesService, CreateDisputeDto } from './disputes.service';
import { DisputeStatus, DisputeResolution, DisputePriority, DisputeType } from './dispute.entity';
export declare class DisputesController {
    private readonly svc;
    constructor(svc: DisputesService);
    create(uid: string, dto: CreateDisputeDto): Promise<import("./dispute.entity").Dispute>;
    getMyDisputes(uid: string, page: number, limit: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./dispute.entity").Dispute>>;
    getOne(id: string, uid: string): Promise<import("./dispute.entity").Dispute>;
    respond(id: string, uid: string, response: string): Promise<import("./dispute.entity").Dispute>;
    stats(): Promise<{
        total: number;
        open: number;
        underReview: number;
        awaitingResponse: number;
        resolved: number;
        escalated: number;
        closed: number;
    }>;
    adminListAll(page: number, limit: number, status?: DisputeStatus, type?: DisputeType, priority?: DisputePriority, search?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./dispute.entity").Dispute>>;
    adminGetOne(id: string): Promise<import("./dispute.entity").Dispute>;
    adminUpdateStatus(id: string, status: DisputeStatus, adminNote?: string, assignedToId?: string): Promise<import("./dispute.entity").Dispute>;
    adminSetPriority(id: string, priority: DisputePriority): Promise<import("./dispute.entity").Dispute>;
    adminResolve(id: string, resolution: DisputeResolution, resolutionNote: string): Promise<import("./dispute.entity").Dispute>;
}
