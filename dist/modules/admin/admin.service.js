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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../users/user.entity");
const product_entity_1 = require("../products/product.entity");
const order_entity_1 = require("../orders/order.entity");
const payment_entity_1 = require("../payments/payment.entity");
const redis_service_1 = require("../redis/redis.service");
let AdminService = AdminService_1 = class AdminService {
    constructor(userRepo, prodRepo, orderRepo, payRepo, redis) {
        this.userRepo = userRepo;
        this.prodRepo = prodRepo;
        this.orderRepo = orderRepo;
        this.payRepo = payRepo;
        this.redis = redis;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async getDashboard() {
        return this.redis.cacheOrFetch('admin:dashboard', () => this.buildDashboard(), 120);
    }
    async buildDashboard() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const week = new Date(today.getTime() - 7 * 86400000);
        const [totalUsers, buyers, sellers, admins, newToday, newThisWeek, totalProds, activeProds, pendingProds, soldOut, totalOrders, pendingOrders, processingOrders, deliveredOrders, cancelledOrders, totalPay, successPay, failedPay, recentOrders, topProds,] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({ where: { role: user_entity_1.UserRole.BUYER } }),
            this.userRepo.count({ where: { role: user_entity_1.UserRole.SELLER } }),
            this.userRepo.count({ where: { role: user_entity_1.UserRole.ADMIN } }),
            this.userRepo.createQueryBuilder('u').where('u.createdAt >= :d', { d: today }).getCount(),
            this.userRepo.createQueryBuilder('u').where('u.createdAt >= :d', { d: week }).getCount(),
            this.prodRepo.count(),
            this.prodRepo.count({ where: { status: product_entity_1.ProductStatus.ACTIVE } }),
            this.prodRepo.count({ where: { status: product_entity_1.ProductStatus.PENDING } }),
            this.prodRepo.count({ where: { status: product_entity_1.ProductStatus.SOLD_OUT } }),
            this.orderRepo.count(),
            this.orderRepo.count({ where: { status: order_entity_1.OrderStatus.PENDING } }),
            this.orderRepo.count({ where: { status: order_entity_1.OrderStatus.PROCESSING } }),
            this.orderRepo.count({ where: { status: order_entity_1.OrderStatus.DELIVERED } }),
            this.orderRepo.count({ where: { status: order_entity_1.OrderStatus.CANCELLED } }),
            this.payRepo.count(),
            this.payRepo.count({ where: { status: payment_entity_1.TxStatus.SUCCESS } }),
            this.payRepo.count({ where: { status: payment_entity_1.TxStatus.FAILED } }),
            this.orderRepo.find({ order: { createdAt: 'DESC' }, take: 10, relations: ['buyer'] }),
            this.prodRepo.find({ order: { salesCount: 'DESC' }, take: 5 }),
        ]);
        const revenueNGN = await this.orderRepo
            .createQueryBuilder('o')
            .where('o.paymentStatus = :ps AND o.currency = :cur', { ps: order_entity_1.PaymentStatus.PAID, cur: 'NGN' })
            .select('COALESCE(SUM(o.total), 0)', 'total').getRawOne()
            .then(r => Number(r?.total || 0));
        const revenueUSD = await this.orderRepo
            .createQueryBuilder('o')
            .where('o.paymentStatus = :ps AND o.currency = :cur', { ps: order_entity_1.PaymentStatus.PAID, cur: 'USD' })
            .select('COALESCE(SUM(o.total), 0)', 'total').getRawOne()
            .then(r => Number(r?.total || 0));
        const totalRevenue = await this.payRepo
            .createQueryBuilder('p')
            .where('p.status = :s', { s: payment_entity_1.TxStatus.SUCCESS })
            .select('COALESCE(SUM(p.amount), 0)', 'total').getRawOne()
            .then(r => Number(r?.total || 0));
        const todayOrders = await this.orderRepo
            .createQueryBuilder('o').where('o.createdAt >= :d', { d: today }).getCount();
        const revenueByDay = await this.payRepo
            .createQueryBuilder('p')
            .where('p.status = :s AND p.createdAt >= :w', { s: payment_entity_1.TxStatus.SUCCESS, w: week })
            .select("TO_CHAR(p.createdAt, 'YYYY-MM-DD')", 'date')
            .addSelect('SUM(p.amount)', 'amount')
            .groupBy("TO_CHAR(p.createdAt, 'YYYY-MM-DD')")
            .orderBy('date', 'ASC')
            .getRawMany()
            .then(rows => rows.map(r => ({ date: r.date, amount: Number(r.amount) })));
        return {
            users: { total: totalUsers, buyers, sellers, admins, newToday, newThisWeek },
            products: { total: totalProds, active: activeProds, pending: pendingProds, soldOut },
            orders: {
                total: totalOrders, pending: pendingOrders, processing: processingOrders,
                delivered: deliveredOrders, cancelled: cancelledOrders,
                revenueNGN, revenueUSD, todayCount: todayOrders,
            },
            payments: { total: totalPay, successful: successPay, failed: failedPay, totalRevenue },
            recentOrders,
            topProducts: topProds.map(p => ({
                id: p.id, name: p.name,
                salesCount: p.salesCount,
                revenue: p.salesCount * Number(p.price),
            })),
            revenueByDay,
        };
    }
    async verifySeller(sellerId, approved) {
        await this.userRepo.update(sellerId, {
            sellerVerified: approved,
            status: approved ? user_entity_1.UserStatus.ACTIVE : user_entity_1.UserStatus.PENDING,
        });
        await this.redis.del(`user:${sellerId}`);
        return this.userRepo.findOne({ where: { id: sellerId } });
    }
    async getPendingProducts() {
        return this.prodRepo.find({
            where: { status: product_entity_1.ProductStatus.PENDING },
            relations: ['seller', 'category'],
            order: { createdAt: 'ASC' },
        });
    }
    async moderateProduct(productId, action, reason) {
        const status = action === 'approve' ? product_entity_1.ProductStatus.ACTIVE : product_entity_1.ProductStatus.INACTIVE;
        await this.prodRepo.update(productId, { status });
        await this.redis.del(`product:${productId}`);
        await this.redis.delByPattern('products:*');
        return this.prodRepo.findOne({ where: { id: productId }, relations: ['seller'] });
    }
    async setFeatured(productId, featured, badge) {
        await this.prodRepo.update(productId, { featured, badge: badge || null });
        await this.redis.del(`product:${productId}`);
        await this.redis.del('products:featured');
    }
    async getSystemHealth() {
        const [dbOk, redisOk] = await Promise.all([
            this.userRepo.count().then(() => true).catch(() => false),
            this.redis.set('health:ping', '1', 5).then(() => true).catch(() => false),
        ]);
        return {
            status: dbOk && redisOk ? 'healthy' : 'degraded',
            database: dbOk ? 'connected' : 'error',
            redis: redisOk ? 'connected' : 'error',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
        };
    }
    async clearDashboardCache() {
        await this.redis.del('admin:dashboard');
        this.logger.debug('Admin dashboard cache cleared');
    }
    async cleanExpiredSessions() {
        await this.userRepo
            .createQueryBuilder()
            .update(user_entity_1.User)
            .set({ refreshToken: null, refreshTokenExpiry: null })
            .where('refreshTokenExpiry < :now', { now: new Date() })
            .execute();
        this.logger.log('Expired refresh tokens cleaned');
    }
    async seedSuperAdmin(seedKey, email, password) {
        const expectedKey = process.env.ADMIN_SEED_KEY;
        if (!expectedKey || seedKey !== expectedKey) {
            throw new common_1.ForbiddenException('Invalid seed key');
        }
        let user = await this.userRepo.findOne({ where: { email } });
        const hashedPassword = password ? await bcrypt.hash(password, 12) : undefined;
        if (user) {
            await this.userRepo.update(user.id, {
                role: user_entity_1.UserRole.SUPER_ADMIN,
                isSuperAdmin: true,
                status: user_entity_1.UserStatus.ACTIVE,
                emailVerified: true,
                provider: user_entity_1.AuthProvider.LOCAL,
                ...(hashedPassword && { password: hashedPassword }),
            });
            await this.redis.del(`user:${user.id}`);
            return { created: false, email, message: `${email} promoted to super_admin` };
        }
        if (!password) {
            throw new common_1.NotFoundException('User not found. Provide a password to create the account.');
        }
        const newUser = this.userRepo.create({
            email,
            firstName: email.split('@')[0],
            lastName: 'Admin',
            password: hashedPassword,
            role: user_entity_1.UserRole.SUPER_ADMIN,
            isSuperAdmin: true,
            status: user_entity_1.UserStatus.ACTIVE,
            emailVerified: true,
            provider: user_entity_1.AuthProvider.LOCAL,
        });
        await this.userRepo.save(newUser);
        return { created: true, email, message: `Super admin account created for ${email}` };
    }
    async globalSearch(query) {
        const q = `%${query}%`;
        const [users, products, orders] = await Promise.all([
            this.userRepo.createQueryBuilder('u')
                .where('u.email ILIKE :q OR u.firstName ILIKE :q', { q })
                .take(5).getMany(),
            this.prodRepo.createQueryBuilder('p')
                .where('p.name ILIKE :q OR p.brand ILIKE :q', { q })
                .take(5).getMany(),
            this.orderRepo.createQueryBuilder('o')
                .where('o.orderNumber ILIKE :q', { q })
                .take(5).getMany(),
        ]);
        return { users, products, orders };
    }
};
exports.AdminService = AdminService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminService.prototype, "clearDashboardCache", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminService.prototype, "cleanExpiredSessions", null);
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(3, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], AdminService);
//# sourceMappingURL=admin.service.js.map