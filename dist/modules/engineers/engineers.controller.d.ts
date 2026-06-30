import { EngineersService, CreateEngineerDto } from './engineers.service';
import { EngineerStatus } from './engineer.entity';
export declare class EngineersController {
    private readonly svc;
    constructor(svc: EngineersService);
    search(page?: number, limit?: number, city?: string, state?: string, specialization?: string, minRating?: number, availableOnly?: string, minYears?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./engineer.entity").Engineer>>;
    getPublic(id: string): Promise<import("./engineer.entity").Engineer>;
    getMyProfile(uid: string): Promise<import("./engineer.entity").Engineer>;
    create(uid: string, dto: CreateEngineerDto): Promise<import("./engineer.entity").Engineer>;
    update(uid: string, dto: Partial<CreateEngineerDto>): Promise<import("./engineer.entity").Engineer>;
    listAll(page?: number, limit?: number, status?: string, state?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./engineer.entity").Engineer>>;
    updateStatus(id: string, status: EngineerStatus, adminNote: string): Promise<import("./engineer.entity").Engineer>;
    verify(id: string): Promise<import("./engineer.entity").Engineer>;
}
