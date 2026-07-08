import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus, AuthProvider } from '../users/user.entity';
import { Product, ProductStatus } from '../products/product.entity';
import { Order, OrderStatus, PaymentStatus } from '../orders/order.entity';
import { Payment, TxStatus } from '../payments/payment.entity';
import { RedisService } from '../redis/redis.service';
import { paginate, paginationToSkipTake } from '@common/utils/pagination.util';

export interface DashboardStats {
  users: {
    total: number; buyers: number; sellers: number; admins: number;
    newToday: number; newThisWeek: number;
  };
  products: {
    total: number; active: number; pending: number; soldOut: number;
  };
  orders: {
    total: number; pending: number; processing: number; delivered: number; cancelled: number;
    revenueNGN: number; revenueUSD: number; todayCount: number;
  };
  payments: {
    total: number; successful: number; failed: number; totalRevenue: number;
  };
  recentOrders: Order[];
  topProducts: Array<{ id: string; name: string; salesCount: number; revenue: number }>;
  revenueByDay: Array<{ date: string; amount: number }>;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)    private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly prodRepo: Repository<Product>,
    @InjectRepository(Order)   private readonly orderRepo: Repository<Order>,
    @InjectRepository(Payment) private readonly payRepo:   Repository<Payment>,
    private readonly redis: RedisService,
  ) {}

  // ── Dashboard ─────────────────────────────────────────────
  async getDashboard(): Promise<DashboardStats> {
    return this.redis.cacheOrFetch<DashboardStats>(
      'admin:dashboard',
      () => this.buildDashboard(),
      120, // cache 2 minutes
    );
  }

  private async buildDashboard(): Promise<DashboardStats> {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(today.getTime() - 7 * 86400000);

    const [
      totalUsers, buyers, sellers, admins, newToday, newThisWeek,
      totalProds, activeProds, pendingProds, soldOut,
      totalOrders, pendingOrders, processingOrders, deliveredOrders, cancelledOrders,
      totalPay, successPay, failedPay,
      recentOrders, topProds,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { role: UserRole.BUYER } }),
      this.userRepo.count({ where: { role: UserRole.SELLER } }),
      this.userRepo.count({ where: { role: UserRole.ADMIN } }),
      this.userRepo.createQueryBuilder('u').where('u.createdAt >= :d', { d: today }).getCount(),
      this.userRepo.createQueryBuilder('u').where('u.createdAt >= :d', { d: week }).getCount(),

      this.prodRepo.count(),
      this.prodRepo.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prodRepo.count({ where: { status: ProductStatus.PENDING } }),
      this.prodRepo.count({ where: { status: ProductStatus.SOLD_OUT } }),

      this.orderRepo.count(),
      this.orderRepo.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepo.count({ where: { status: OrderStatus.PROCESSING } }),
      this.orderRepo.count({ where: { status: OrderStatus.DELIVERED } }),
      this.orderRepo.count({ where: { status: OrderStatus.CANCELLED } }),

      this.payRepo.count(),
      this.payRepo.count({ where: { status: TxStatus.SUCCESS } }),
      this.payRepo.count({ where: { status: TxStatus.FAILED } }),

      this.orderRepo.find({ order: { createdAt: 'DESC' }, take: 10, relations: ['buyer'] }),
      this.prodRepo.find({ order: { salesCount: 'DESC' }, take: 5 }),
    ]);

    // Revenue
    const revenueNGN = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.paymentStatus = :ps AND o.currency = :cur', { ps: PaymentStatus.PAID, cur: 'NGN' })
      .select('COALESCE(SUM(o.total), 0)', 'total').getRawOne()
      .then(r => Number(r?.total || 0));

    const revenueUSD = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.paymentStatus = :ps AND o.currency = :cur', { ps: PaymentStatus.PAID, cur: 'USD' })
      .select('COALESCE(SUM(o.total), 0)', 'total').getRawOne()
      .then(r => Number(r?.total || 0));

    const totalRevenue = await this.payRepo
      .createQueryBuilder('p')
      .where('p.status = :s', { s: TxStatus.SUCCESS })
      .select('COALESCE(SUM(p.amount), 0)', 'total').getRawOne()
      .then(r => Number(r?.total || 0));

    const todayOrders = await this.orderRepo
      .createQueryBuilder('o').where('o.createdAt >= :d', { d: today }).getCount();

    // Revenue last 7 days
    const revenueByDay = await this.payRepo
      .createQueryBuilder('p')
      .where('p.status = :s AND p.createdAt >= :w', { s: TxStatus.SUCCESS, w: week })
      .select("TO_CHAR(p.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(p.amount)', 'amount')
      .groupBy("TO_CHAR(p.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany()
      .then(rows => rows.map(r => ({ date: r.date, amount: Number(r.amount) })));

    return {
      users:    { total: totalUsers, buyers, sellers, admins, newToday, newThisWeek },
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

  // ── Seller verification ────────────────────────────────────
  async verifySeller(sellerId: string, approved: boolean): Promise<User> {
    await this.userRepo.update(sellerId, {
      sellerVerified: approved,
      status: approved ? UserStatus.ACTIVE : UserStatus.PENDING,
    });
    await this.redis.del(`user:${sellerId}`);
    return this.userRepo.findOne({ where: { id: sellerId } });
  }

  // ── Product moderation ─────────────────────────────────────
  async getPendingProducts() {
    return this.prodRepo.find({
      where: { status: ProductStatus.PENDING },
      relations: ['seller', 'category'],
      order: { createdAt: 'ASC' },
    });
  }

  async moderateProduct(
    productId: string,
    action: 'approve' | 'reject',
    reason?: string,
  ): Promise<Product> {
    const status = action === 'approve' ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
    await this.prodRepo.update(productId, { status });
    await this.redis.del(`product:${productId}`);
    await this.redis.delByPattern('products:*');
    return this.prodRepo.findOne({ where: { id: productId }, relations: ['seller'] });
  }

  // ── Feature / unfeature product ───────────────────────────
  async setFeatured(productId: string, featured: boolean, badge?: string): Promise<void> {
    await this.prodRepo.update(productId, { featured, badge: badge || null });
    await this.redis.del(`product:${productId}`);
    await this.redis.del('products:featured');
  }

  // ── System health ─────────────────────────────────────────
  async getSystemHealth() {
    const [dbOk, redisOk] = await Promise.all([
      this.userRepo.count().then(() => true).catch(() => false),
      this.redis.set('health:ping', '1', 5).then(() => true).catch(() => false),
    ]);

    return {
      status:    dbOk && redisOk ? 'healthy' : 'degraded',
      database:  dbOk ? 'connected' : 'error',
      redis:     redisOk ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
      uptime:    Math.floor(process.uptime()),
      memory:    process.memoryUsage(),
      nodeVersion: process.version,
    };
  }

  // ── Scheduled: clear dashboard cache every 2 min ──────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async clearDashboardCache() {
    await this.redis.del('admin:dashboard');
    this.logger.debug('Admin dashboard cache cleared');
  }

  // ── Scheduled: clean expired sessions daily ───────────────
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanExpiredSessions() {
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ refreshToken: null, refreshTokenExpiry: null })
      .where('refreshTokenExpiry < :now', { now: new Date() })
      .execute();
    this.logger.log('Expired refresh tokens cleaned');
  }

  // ── Super-admin seed ──────────────────────────────────────
  async seedSuperAdmin(
    seedKey: string,
    email: string,
    password?: string,
  ): Promise<{ created: boolean; email: string; message: string }> {
    const expectedKey = process.env.ADMIN_SEED_KEY;
    if (!expectedKey || seedKey !== expectedKey) {
      throw new ForbiddenException('Invalid seed key');
    }

    let user = await this.userRepo.findOne({ where: { email } });

    const hashedPassword = password ? await bcrypt.hash(password, 12) : undefined;

    if (user) {
      await this.userRepo.update(user.id, {
        role:          UserRole.SUPER_ADMIN,
        isSuperAdmin:  true,
        status:        UserStatus.ACTIVE,
        emailVerified: true,
        provider:      AuthProvider.LOCAL,          // allow email+password login
        ...(hashedPassword && { password: hashedPassword }),
      });
      await this.redis.del(`user:${user.id}`);
      return { created: false, email, message: `${email} promoted to super_admin` };
    }

    if (!password) {
      throw new NotFoundException('User not found. Provide a password to create the account.');
    }

    const newUser = this.userRepo.create({
      email,
      firstName:     email.split('@')[0],
      lastName:      'Admin',
      password:      hashedPassword,
      role:          UserRole.SUPER_ADMIN,
      isSuperAdmin:  true,
      status:        UserStatus.ACTIVE,
      emailVerified: true,
      provider:      AuthProvider.LOCAL,
    });
    await this.userRepo.save(newUser);
    return { created: true, email, message: `Super admin account created for ${email}` };
  }

  // ── Order detail (with seller info per item) ──────────────
  async getOrderDetail(id: string) {
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['buyer'] });
    if (!order) throw new NotFoundException('Order not found');

    const sellerIds = [...new Set((order.items || []).map(i => i.sellerId).filter(Boolean))];
    let sellerMap: Record<string, any> = {};
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

  // ── User detail (with recent orders + seller stats) ────────
  async getUserDetail(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const [recentOrders, totalOrders] = await this.orderRepo.findAndCount({
      where: { buyerId: id },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    let sellerStats: any = null;
    if (user.role === UserRole.SELLER) {
      const [productCount, revenueRow] = await Promise.all([
        this.prodRepo.count({ where: { sellerId: id } }),
        this.orderRepo
          .createQueryBuilder('o')
          .innerJoin('o.items', 'i', 'i.sellerId = :sid', { sid: id })
          .where('o.paymentStatus = :ps', { ps: PaymentStatus.PAID })
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

  // ── Fraud & Trust ──────────────────────────────────────────────────────────

  async flagUser(id: string, reason: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isFlagged  = true;
    user.flaggedAt  = new Date();
    user.flagReason = reason;
    return this.userRepo.save(user);
  }

  async unflagUser(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isFlagged  = false;
    user.flaggedAt  = null;
    user.flagReason = null;
    return this.userRepo.save(user);
  }

  async getFlaggedUsers(page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.userRepo.findAndCount({
      where: { isFlagged: true },
      order: { flaggedAt: 'DESC' },
      skip, take,
    });
    return paginate(data, total, page, limit);
  }

  async getRiskyPayments(page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.payRepo
      .createQueryBuilder('p')
      .where('p."isDisputed" = true OR p."riskScore" > 50 OR p."chargebackAt" IS NOT NULL')
      .orderBy('p.createdAt', 'DESC')
      .skip(skip).take(take)
      .getManyAndCount();
    return paginate(data, total, page, limit);
  }

  // ── Payment detail ────────────────────────────────────────
  async getPaymentDetail(id: string) {
    const payment = await this.payRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');

    const [user, order] = await Promise.all([
      payment.userId
        ? this.userRepo.findOne({
            where: { id: payment.userId },
            select: ['id', 'firstName', 'lastName', 'email', 'phone', 'role'] as any,
          })
        : Promise.resolve(null),
      payment.orderId
        ? this.orderRepo.findOne({
            where: { id: payment.orderId },
            select: ['id', 'orderNumber', 'status', 'total', 'deliveryAddress'] as any,
          })
        : Promise.resolve(null),
    ]);

    return { ...payment, user, order };
  }

  // ── Analytics ─────────────────────────────────────────────
  async getAnalytics(days: number) {
    const from = new Date(Date.now() - days * 86400000);

    // Revenue by day
    const revenueByDay = await this.payRepo
      .createQueryBuilder('p')
      .where('p.status = :s AND p.createdAt >= :from', { s: TxStatus.SUCCESS, from })
      .select("TO_CHAR(p.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'amount')
      .groupBy("TO_CHAR(p.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany()
      .then(rows => rows.map(r => ({ date: r.date, amount: Number(r.amount) })));

    // Orders by day
    const ordersByDay = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.createdAt >= :from', { from })
      .select("TO_CHAR(o.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(o.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany()
      .then(rows => rows.map(r => ({ date: r.date, count: Number(r.count) })));

    // New users by day
    const usersByDay = await this.userRepo
      .createQueryBuilder('u')
      .where('u.createdAt >= :from', { from })
      .select("TO_CHAR(u.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(u.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany()
      .then(rows => rows.map(r => ({ date: r.date, count: Number(r.count) })));

    // Orders by status breakdown
    const ordersByStatus = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany()
      .then(rows => rows.map(r => ({ name: r.status, value: Number(r.count) })));

    // Category breakdown — products sold per category
    const categoryBreakdown = await this.prodRepo
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c')
      .select("COALESCE(c.name, 'Other')", 'name')
      .addSelect('COALESCE(SUM(p.salesCount), 0)', 'salesCount')
      .groupBy('c.name')
      .orderBy('COALESCE(SUM(p.salesCount), 0)', 'DESC')
      .getRawMany()
      .then(rows => rows.map(r => ({ name: r.name || 'Other', value: Number(r.salesCount) })));

    // Top sellers by item revenue on paid orders
    const sellerRevRows = await this.orderRepo
      .createQueryBuilder('o')
      .innerJoin('o.items', 'i')
      .where('o.paymentStatus = :ps', { ps: PaymentStatus.PAID })
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
        name: u?.storeName || (u ? `${u.firstName} ${u.lastName}` : r.sellerId?.slice(0,8)),
        revenue: Number(r.revenue),
        orderCount: Number(r.orderCount),
      };
    });

    // Summary totals for the period
    const [periodRevenue, periodOrders, periodUsers] = await Promise.all([
      this.payRepo.createQueryBuilder('p')
        .where('p.status = :s AND p.createdAt >= :from', { s: TxStatus.SUCCESS, from })
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

  // ── Search across entities ─────────────────────────────────
  async globalSearch(query: string) {
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
}
