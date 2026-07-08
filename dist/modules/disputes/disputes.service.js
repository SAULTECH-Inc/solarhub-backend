"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dispute_entity_1 = require("./dispute.entity");
const pagination_util_1 = require("../../common/utils/pagination.util");
let DisputesService = class DisputesService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(claimantId, dto) {
        const dispute = this.repo.create({ ...dto, claimantId });
        return this.repo.save(dispute);
    }
    async getMyDisputes(userId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.repo.findAndCount({
            where: { claimantId: userId },
            order: { createdAt: 'DESC' },
            skip, take,
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getById(id, userId) {
        const d = await this.repo.findOne({
            where: { id },
            relations: ['claimant', 'respondent', 'assignedTo'],
        });
        if (!d)
            throw new common_1.NotFoundException('Dispute not found');
        if (userId && d.claimantId !== userId && d.respondentId !== userId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return d;
    }
    async addResponse(id, userId, response) {
        const d = await this.getById(id, userId);
        d.respondentResponse = response;
        if (d.status === dispute_entity_1.DisputeStatus.AWAITING_RESPONSE)
            d.status = dispute_entity_1.DisputeStatus.UNDER_REVIEW;
        return this.repo.save(d);
    }
    async adminListAll(page, limit, filters) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const qb = this.repo.createQueryBuilder('d')
            .leftJoinAndSelect('d.claimant', 'claimant')
            .leftJoinAndSelect('d.respondent', 'respondent')
            .leftJoinAndSelect('d.assignedTo', 'assignedTo')
            .orderBy('d.createdAt', 'DESC')
            .skip(skip).take(take);
        if (filters.status)
            qb.andWhere('d.status = :status', { status: filters.status });
        if (filters.type)
            qb.andWhere('d.type = :type', { type: filters.type });
        if (filters.priority)
            qb.andWhere('d.priority = :priority', { priority: filters.priority });
        if (filters.search) {
            qb.andWhere(`(claimant."firstName" ILIKE :s OR claimant.email ILIKE :s OR d.subject ILIKE :s)`, { s: `%${filters.search}%` });
        }
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async adminGetById(id) {
        const d = await this.repo.findOne({
            where: { id },
            relations: ['claimant', 'respondent', 'assignedTo'],
        });
        if (!d)
            throw new common_1.NotFoundException('Dispute not found');
        return d;
    }
    async adminUpdateStatus(id, status, adminNote, assignedToId) {
        const d = await this.adminGetById(id);
        d.status = status;
        if (adminNote)
            d.adminNote = adminNote;
        if (assignedToId)
            d.assignedToId = assignedToId;
        if (status === dispute_entity_1.DisputeStatus.AWAITING_RESPONSE) {
            d.respondentDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        }
        return this.repo.save(d);
    }
    async adminResolve(id, resolution, resolutionNote) {
        const d = await this.adminGetById(id);
        d.status = dispute_entity_1.DisputeStatus.RESOLVED;
        d.resolution = resolution;
        d.resolutionNote = resolutionNote;
        d.resolvedAt = new Date();
        return this.repo.save(d);
    }
    async adminSetPriority(id, priority) {
        const d = await this.adminGetById(id);
        d.priority = priority;
        return this.repo.save(d);
    }
    async getStats() {
        const [total, open, underReview, awaitingResponse, resolved, escalated, closed] = await Promise.all([
            this.repo.count(),
            this.repo.count({ where: { status: dispute_entity_1.DisputeStatus.OPEN } }),
            this.repo.count({ where: { status: dispute_entity_1.DisputeStatus.UNDER_REVIEW } }),
            this.repo.count({ where: { status: dispute_entity_1.DisputeStatus.AWAITING_RESPONSE } }),
            this.repo.count({ where: { status: dispute_entity_1.DisputeStatus.RESOLVED } }),
            this.repo.count({ where: { status: dispute_entity_1.DisputeStatus.ESCALATED } }),
            this.repo.count({ where: { status: dispute_entity_1.DisputeStatus.CLOSED } }),
        ]);
        return { total, open, underReview, awaitingResponse, resolved, escalated, closed };
    }
};
exports.DisputesService = DisputesService;
exports.DisputesService = DisputesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dispute_entity_1.Dispute)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DisputesService);
//# sourceMappingURL=disputes.service.js.map