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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const user_entity_1 = require("./user.entity");
const redis_service_1 = require("../redis/redis.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let UsersService = class UsersService {
    constructor(repo, redis) {
        this.repo = repo;
        this.redis = redis;
    }
    async findById(id) {
        const user = await this.repo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findByEmail(email) {
        return this.repo.findOne({ where: { email: email.toLowerCase() } });
    }
    async updateProfile(userId, dto) {
        const user = await this.findById(userId);
        const forbidden = ['id', 'email', 'role', 'password', 'status', 'emailVerified', 'provider', 'googleId', 'refreshToken'];
        forbidden.forEach(k => delete dto[k]);
        Object.assign(user, dto);
        const saved = await this.repo.save(user);
        await this.redis.del(`user:${userId}`);
        return saved;
    }
    async getProfile(userId) {
        return this.redis.cacheOrFetch(`user:${userId}`, () => this.findById(userId), 300);
    }
    async addAddress(userId, address) {
        const user = await this.findById(userId);
        const newAddr = { ...address, id: (0, uuid_1.v4)() };
        if (address.isDefault || !user.addresses.length) {
            user.addresses = user.addresses.map(a => ({ ...a, isDefault: false }));
        }
        user.addresses.push(newAddr);
        return this.repo.save(user);
    }
    async updateAddress(userId, addrId, update) {
        const user = await this.findById(userId);
        const idx = user.addresses.findIndex(a => a.id === addrId);
        if (idx === -1)
            throw new common_1.NotFoundException('Address not found');
        if (update.isDefault)
            user.addresses = user.addresses.map(a => ({ ...a, isDefault: false }));
        user.addresses[idx] = { ...user.addresses[idx], ...update, id: addrId };
        return this.repo.save(user);
    }
    async deleteAddress(userId, addrId) {
        const user = await this.findById(userId);
        user.addresses = user.addresses.filter(a => a.id !== addrId);
        return this.repo.save(user);
    }
    async becomeSeller(userId, dto) {
        const user = await this.findById(userId);
        const required = ['storeName', 'storeAddress', 'storeCity', 'storeState', 'businessRegNumber', 'nin', 'govtIdType'];
        for (const field of required) {
            if (!dto[field])
                throw new common_1.BadRequestException(`Field "${field}" is required to become a seller`);
        }
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);
        Object.assign(user, {
            ...dto,
            isSeller: true,
            sellerProfileComplete: true,
            status: user_entity_1.UserStatus.ACTIVE,
            subscriptionTier: 'pro_seller',
            subscriptionStatus: 'trialing',
            trialEndsAt: trialEnd,
        });
        const saved = await this.repo.save(user);
        await this.redis.del(`user:${userId}`);
        return saved;
    }
    async updateSellerProfile(userId, dto) {
        const user = await this.findById(userId);
        if (!user.isSeller)
            throw new common_1.BadRequestException('Not a seller account');
        const allowed = [
            'storeName', 'storeDescription', 'storeBanner', 'storeAddress',
            'storeCity', 'storeState', 'storeLatitude', 'storeLongitude',
            'businessType', 'businessRegNumber', 'taxId', 'nin', 'ninData', 'govtIdType', 'govtIdUrl',
        ];
        allowed.forEach(k => { if (dto[k] !== undefined)
            user[k] = dto[k]; });
        const saved = await this.repo.save(user);
        await this.redis.del(`user:${userId}`);
        return saved;
    }
    async listAll(page, limit, filters) {
        const qb = this.repo.createQueryBuilder('u');
        if (filters.role === 'seller')
            qb.andWhere('u.isSeller = true');
        else if (filters.role === 'engineer')
            qb.andWhere('u.isEngineer = true');
        else if (filters.role)
            qb.andWhere('u.role = :role', { role: filters.role });
        if (filters.status)
            qb.andWhere('u.status = :status', { status: filters.status });
        if (filters.search)
            qb.andWhere('(u.email ILIKE :q OR u.firstName ILIKE :q)', { q: `%${filters.search}%` });
        qb.skip((page - 1) * limit).take(limit).orderBy('u.createdAt', 'DESC');
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async updateStatus(userId, status) {
        await this.repo.update(userId, { status });
        return this.findById(userId);
    }
    async getStats() {
        const [total, sellers, engineers, buyers, admins] = await Promise.all([
            this.repo.count(),
            this.repo.count({ where: { isSeller: true } }),
            this.repo.count({ where: { isEngineer: true } }),
            this.repo.count({ where: { role: user_entity_1.UserRole.BUYER } }),
            this.repo.count({ where: { role: user_entity_1.UserRole.ADMIN } }),
        ]);
        return { total, sellers, engineers, buyers, admins };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redis_service_1.RedisService])
], UsersService);
//# sourceMappingURL=users.service.js.map