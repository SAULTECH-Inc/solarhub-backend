import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { Product, ProductStatus } from '../products/product.entity';
import { Order, OrderStatus, PaymentStatus } from '../orders/order.entity';
import { Payment, TxStatus } from '../payments/payment.entity';
import { RedisService } from '../redis/redis.service';

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
