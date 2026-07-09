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
const pagination_util_1 = require("../../common/utils/pagination.util");
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
    async getOrderDetail(id) {
        const order = await this.orderRepo.findOne({ where: { id }, relations: ['buyer'] });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const sellerIds = [...new Set((order.items || []).map(i => i.sellerId).filter(Boolean))];
        let sellerMap = {};
        if (sellerIds.length) {
            const sellers = await this.userRepo
                .createQueryBuilder('u')
                .select(['u.id', 'u.firstName', 'u.lastName', 'u.storeName', 'u.email', 'u.phone'])
                .where('u.id IN (:...ids)', { ids: sellerIds })
                .getMany();
            sellerMap = Object.fromEntries(sellers.map(s => [s.id, s]));
        }
        return {
            ...order,
            itemsWithSeller: (order.items || []).map(item => ({
                ...item,
                seller: sellerMap[item.sellerId] || null,
            })),
        };
    }
    async getUserDetail(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const [recentOrders, totalOrders] = await this.orderRepo.findAndCount({
            where: { buyerId: id },
            order: { createdAt: 'DESC' },
            take: 5,
        });
        let sellerStats = null;
        if (user.role === user_entity_1.UserRole.SELLER) {
            const [productCount, revenueRow] = await Promise.all([
                this.prodRepo.count({ where: { sellerId: id } }),
                this.orderRepo
                    .createQueryBuilder('o')
                    .innerJoin('o.items', 'i', 'i.sellerId = :sid', { sid: id })
                    .where('o.paymentStatus = :ps', { ps: order_entity_1.PaymentStatus.PAID })
                    .select('COALESCE(SUM(i.subtotal), 0)', 'total')
                    .getRawOne(),
            ]);
            sellerStats = {
                productCount,
                totalRevenue: Number(revenueRow?.total || 0),
            };
        }
        return { user, recentOrders, totalOrders, sellerStats };
    }
    async flagUser(id, reason) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.isFlagged = true;
        user.flaggedAt = new Date();
        user.flagReason = reason;
        return this.userRepo.save(user);
    }
    async unflagUser(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.isFlagged = false;
        user.flaggedAt = null;
        user.flagReason = null;
        return this.userRepo.save(user);
    }
    async getFlaggedUsers(page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.userRepo.findAndCount({
            where: { isFlagged: true },
            order: { flaggedAt: 'DESC' },
            skip, take,
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getRiskyPayments(page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.payRepo
            .createQueryBuilder('p')
            .where('p."isDisputed" = true OR p."riskScore" > 50 OR p."chargebackAt" IS NOT NULL')
            .orderBy('p.createdAt', 'DESC')
            .skip(skip).take(take)
            .getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getPaymentDetail(id) {
        const payment = await this.payRepo.findOne({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const [user, order] = await Promise.all([
            payment.userId
                ? this.userRepo.findOne({
                    where: { id: payment.userId },
                    select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role'],
                })
                : Promise.resolve(null),
            payment.orderId
                ? this.orderRepo.findOne({
                    where: { id: payment.orderId },
                    select: ['id', 'orderNumber', 'status', 'total', 'deliveryAddress'],
                })
                : Promise.resolve(null),
        ]);
        return { ...payment, user, order };
    }
    async getAnalytics(days) {
        const from = new Date(Date.now() - days * 86400000);
        const revenueByDay = await this.payRepo
            .createQueryBuilder('p')
            .where('p.status = :s AND p.createdAt >= :from', { s: payment_entity_1.TxStatus.SUCCESS, from })
            .select("TO_CHAR(p.createdAt, 'YYYY-MM-DD')", 'date')
            .addSelect('COALESCE(SUM(p.amount), 0)', 'amount')
            .groupBy("TO_CHAR(p.createdAt, 'YYYY-MM-DD')")
            .orderBy('date', 'ASC')
            .getRawMany()
            .then(rows => rows.map(r => ({ date: r.date, amount: Number(r.amount) })));
        const ordersByDay = await this.orderRepo
            .createQueryBuilder('o')
            .where('o.createdAt >= :from', { from })
            .select("TO_CHAR(o.createdAt, 'YYYY-MM-DD')", 'date')
            .addSelect('COUNT(*)', 'count')
            .groupBy("TO_CHAR(o.createdAt, 'YYYY-MM-DD')")
            .orderBy('date', 'ASC')
            .getRawMany()
            .then(rows => rows.map(r => ({ date: r.date, count: Number(r.count) })));
        const usersByDay = await this.userRepo
            .createQueryBuilder('u')
            .where('u.createdAt >= :from', { from })
            .select("TO_CHAR(u.createdAt, 'YYYY-MM-DD')", 'date')
            .addSelect('COUNT(*)', 'count')
            .groupBy("TO_CHAR(u.createdAt, 'YYYY-MM-DD')")
            .orderBy('date', 'ASC')
            .getRawMany()
            .then(rows => rows.map(r => ({ date: r.date, count: Number(r.count) })));
        const ordersByStatus = await this.orderRepo
            .createQueryBuilder('o')
            .select('o.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('o.status')
            .getRawMany()
            .then(rows => rows.map(r => ({ name: r.status, value: Number(r.count) })));
        const categoryBreakdown = await this.prodRepo
            .createQueryBuilder('p')
            .leftJoin('p.category', 'c')
            .select("COALESCE(c.name, 'Other')", 'name')
            .addSelect('COALESCE(SUM(p.salesCount), 0)', 'salesCount')
            .groupBy('c.name')
            .orderBy('COALESCE(SUM(p.salesCount), 0)', 'DESC')
            .getRawMany()
            .then(rows => rows.map(r => ({ name: r.name || 'Other', value: Number(r.salesCount) })));
        const sellerRevRows = await this.orderRepo
            .createQueryBuilder('o')
            .innerJoin('o.items', 'i')
            .where('o.paymentStatus = :ps', { ps: order_entity_1.PaymentStatus.PAID })
            .select('i.sellerId', 'sellerId')
            .addSelect('COALESCE(SUM(i.subtotal), 0)', 'revenue')
            .addSelect('COUNT(DISTINCT o.id)', 'orderCount')
            .groupBy('i.sellerId')
            .orderBy('COALESCE(SUM(i.subtotal), 0)', 'DESC')
            .limit(6)
            .getRawMany();
        const sellerIds = sellerRevRows.map(r => r.sellerId).filter(Boolean);
        const sellerUsers = sellerIds.length
            ? await this.userRepo
                .createQueryBuilder('u')
                .select(['u.id', 'u.firstName', 'u.lastName', 'u.storeName'])
                .where('u.id IN (:...ids)', { ids: sellerIds })
                .getMany()
            : [];
        const sellerMap = Object.fromEntries(sellerUsers.map(u => [u.id, u]));
        const topSellers = sellerRevRows.map(r => {
            const u = sellerMap[r.sellerId];
            return {
                id: r.sellerId,
                name: u?.storeName || (u ? `${u.firstName} ${u.lastName}` : r.sellerId?.slice(0, 8)),
                revenue: Number(r.revenue),
                orderCount: Number(r.orderCount),
            };
        });
        const [periodRevenue, periodOrders, periodUsers] = await Promise.all([
            this.payRepo.createQueryBuilder('p')
                .where('p.status = :s AND p.createdAt >= :from', { s: payment_entity_1.TxStatus.SUCCESS, from })
                .select('COALESCE(SUM(p.amount), 0)', 'total').getRawOne().then(r => Number(r?.total || 0)),
            this.orderRepo.createQueryBuilder('o')
                .where('o.createdAt >= :from', { from }).getCount(),
            this.userRepo.createQueryBuilder('u')
                .where('u.createdAt >= :from', { from }).getCount(),
        ]);
        return {
            revenueByDay,
            ordersByDay,
            usersByDay,
            ordersByStatus,
            categoryBreakdown,
            topSellers,
            summary: { periodRevenue, periodOrders, periodUsers, days },
        };
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