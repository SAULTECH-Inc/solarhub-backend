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
exports.EngineersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const engineer_entity_1 = require("./engineer.entity");
const user_entity_1 = require("../users/user.entity");
const redis_service_1 = require("../redis/redis.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let EngineersService = class EngineersService {
    constructor(repo, userRepo, redis) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.redis = redis;
    }
    async createProfile(userId, dto) {
        const existing = await this.repo.findOne({ where: { userId } });
        if (existing)
            throw new common_1.BadRequestException('You already have an engineer profile');
        const required = ['fullName', 'nin', 'govtIdType', 'address', 'city', 'state'];
        for (const field of required) {
            if (!dto[field])
                throw new common_1.BadRequestException(`Field "${field}" is required`);
        }
        const engineer = this.repo.create({ ...dto, userId, status: engineer_entity_1.EngineerStatus.ACTIVE });
        const saved = await this.repo.save(engineer);
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);
        await this.userRepo.update(userId, {
            isEngineer: true,
            subscriptionTier: 'pro_engineer',
            subscriptionStatus: 'trialing',
            trialEndsAt: trialEnd,
        });
        await this.redis.del(`user:${userId}`);
        return saved;
    }
    async updateProfile(userId, dto) {
        const engineer = await this.getOwnProfile(userId);
        const forbidden = ['userId', 'id', 'status', 'averageRating', 'reviewCount', 'completedJobs', 'isVerified'];
        forbidden.forEach(k => delete dto[k]);
        Object.assign(engineer, dto);
        const saved = await this.repo.save(engineer);
        await this.redis.del(`engineer:${engineer.id}`);
        return saved;
    }
    async getOwnProfile(userId) {
        const e = await this.repo.findOne({ where: { userId }, relations: ['user'] });
        if (!e)
            throw new common_1.NotFoundException('Engineer profile not found');
        return e;
    }
    async getPublicProfile(id) {
        return this.redis.cacheOrFetch(`engineer:${id}`, async () => {
            const e = await this.repo.findOne({
                where: { id, status: engineer_entity_1.EngineerStatus.ACTIVE },
                relations: ['user'],
            });
            if (!e)
                throw new common_1.NotFoundException('Engineer not found');
            return e;
        }, 300);
    }
    async search(filters, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const qb = this.repo.createQueryBuilder('e')
            .leftJoinAndSelect('e.user', 'u')
            .where('e.status = :status', { status: engineer_entity_1.EngineerStatus.ACTIVE });
        if (filters.city)
            qb.andWhere('e.city ILIKE :city', { city: `%${filters.city}%` });
        if (filters.state)
            qb.andWhere('e.state ILIKE :state', { state: `%${filters.state}%` });
        if (filters.availableOnly)
            qb.andWhere('e.availableForHire = true');
        if (filters.minRating)
            qb.andWhere('e.averageRating >= :mr', { mr: filters.minRating });
        if (filters.minYears)
            qb.andWhere('e.yearsOfExperience >= :my', { my: filters.minYears });
        if (filters.specialization) {
            qb.andWhere('e.specializations::text ILIKE :spec', { spec: `%${filters.specialization}%` });
        }
        qb.skip(skip).take(take)
            .orderBy('e.isVerified', 'DESC')
            .addOrderBy('e.averageRating', 'DESC')
            .addOrderBy('e.createdAt', 'DESC');
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async updateRating(engineerId, avg, count) {
        await this.repo.update(engineerId, { averageRating: avg, reviewCount: count });
        await this.redis.del(`engineer:${engineerId}`);
    }
    async updateStatus(id, status, adminNote) {
        const engineer = await this.repo.findOne({ where: { id } });
        if (!engineer)
            throw new common_1.NotFoundException('Engineer not found');
        engineer.status = status;
        engineer.adminNote = adminNote ?? engineer.adminNote;
        const saved = await this.repo.save(engineer);
        await this.redis.del(`engineer:${id}`);
        return saved;
    }
    async verifyEngineer(id) {
        const engineer = await this.repo.findOne({ where: { id } });
        if (!engineer)
            throw new common_1.NotFoundException('Engineer not found');
        engineer.isVerified = true;
        engineer.verifiedAt = new Date();
        const saved = await this.repo.save(engineer);
        await this.redis.del(`engineer:${id}`);
        return saved;
    }
    async listAll(page, limit, filters) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const qb = this.repo.createQueryBuilder('e').leftJoinAndSelect('e.user', 'u');
        if (filters.status)
            qb.andWhere('e.status = :status', { status: filters.status });
        if (filters.state)
            qb.andWhere('e.state ILIKE :state', { state: `%${filters.state}%` });
        qb.skip(skip).take(take).orderBy('e.createdAt', 'DESC');
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
};
exports.EngineersService = EngineersService;
exports.EngineersService = EngineersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(engineer_entity_1.Engineer)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], EngineersService);
//# sourceMappingURL=engineers.service.js.map