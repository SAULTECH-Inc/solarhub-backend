import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { RedisService } from '../redis/redis.service';
export interface DashboardStats {
    users: {
        total: number;
        buyers: number;
        sellers: number;
        admins: number;
        newToday: number;
        newThisWeek: number;
    };
    products: {
        total: number;
        active: number;
        pending: number;
        soldOut: number;
    };
    orders: {
        total: number;
        pending: number;
        processing: number;
        delivered: number;
        cancelled: number;
        revenueNGN: number;
        revenueUSD: number;
        todayCount: number;
    };
    payments: {
        total: number;
        successful: number;
        failed: number;
        totalRevenue: number;
    };
    recentOrders: Order[];
    topProducts: Array<{
        id: string;
        name: string;
        salesCount: number;
        revenue: number;
    }>;
    revenueByDay: Array<{
        date: string;
        amount: number;
    }>;
}
export declare class AdminService {
    private readonly userRepo;
    private readonly prodRepo;
    private readonly orderRepo;
    private readonly payRepo;
    private readonly redis;
    private readonly logger;
    constructor(userRepo: Repository<User>, prodRepo: Repository<Product>, orderRepo: Repository<Order>, payRepo: Repository<Payment>, redis: RedisService);
    getDashboard(): Promise<DashboardStats>;
    private buildDashboard;
    verifySeller(sellerId: string, approved: boolean): Promise<User>;
    getPendingProducts(): Promise<Product[]>;
    moderateProduct(productId: string, action: 'approve' | 'reject', reason?: string): Promise<Product>;
    setFeatured(productId: string, featured: boolean, badge?: string): Promise<void>;
    getSystemHealth(): Promise<{
        status: string;
        database: string;
        redis: string;
        timestamp: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        nodeVersion: string;
    }>;
    clearDashboardCache(): Promise<void>;
    cleanExpiredSessions(): Promise<void>;
    globalSearch(query: string): Promise<{
        users: User[];
        products: Product[];
        orders: Order[];
    }>;
}
