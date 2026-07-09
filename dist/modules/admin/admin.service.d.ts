import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Order, OrderStatus, PaymentStatus } from '../orders/order.entity';
import { Payment, TxStatus } from '../payments/payment.entity';
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
    seedSuperAdmin(seedKey: string, email: string, password?: string): Promise<{
        created: boolean;
        email: string;
        message: string;
    }>;
    getOrderDetail(id: string): Promise<{
        itemsWithSeller: {
            seller: any;
            id: string;
            orderId: string;
            productId: string;
            sellerId: string;
            productName: string;
            productImage: string;
            productSlug: string;
            unitPrice: number;
            quantity: number;
            subtotal: number;
            status: OrderStatus;
            order: Order;
            reviewed: boolean;
            createdAt: Date;
        }[];
        id: string;
        orderNumber: string;
        buyerId: string;
        buyer: User;
        items: import("../orders/order.entity").OrderItem[];
        status: OrderStatus;
        paymentStatus: PaymentStatus;
        subtotal: number;
        deliveryFee: number;
        discount: number;
        total: number;
        currency: string;
        deliveryAddress: {
            firstName: string;
            lastName: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            country: string;
            landmark?: string;
        };
        deliveryMethod: string;
        estimatedDelivery: Date;
        trackingCode: string;
        paymentReference: string;
        paymentGateway: string;
        paymentMethod: string;
        statusHistory: Array<{
            status: string;
            timestamp: string;
            note?: string;
            updatedBy?: string;
        }>;
        cancelReason: string;
        cancelledAt: Date;
        deliveredAt: Date;
        buyerNote: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserDetail(id: string): Promise<{
        user: User;
        recentOrders: Order[];
        totalOrders: number;
        sellerStats: any;
    }>;
    flagUser(id: string, reason: string): Promise<User>;
    unflagUser(id: string): Promise<User>;
    getFlaggedUsers(page: number, limit: number): Promise<import("@common/utils/pagination.util").PaginatedResult<User>>;
    getRiskyPayments(page: number, limit: number): Promise<import("@common/utils/pagination.util").PaginatedResult<Payment>>;
    getPaymentDetail(id: string): Promise<{
        user: any;
        order: any;
        id: string;
        orderId: string;
        userId: string;
        reference: string;
        amount: number;
        currency: string;
        provider: import("../payments/payment.entity").PaymentProvider;
        method: import("../payments/payment.entity").PaymentMethod;
        status: TxStatus;
        gatewayTransactionId: string;
        paidAt: Date;
        failureReason: string;
        metadata: Record<string, any>;
        refundAmount: number;
        refundedAt: Date;
        refundReason: string;
        isDisputed: boolean;
        disputeId: string;
        riskScore: number;
        chargebackAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAnalytics(days: number): Promise<{
        revenueByDay: {
            date: any;
            amount: number;
        }[];
        ordersByDay: {
            date: any;
            count: number;
        }[];
        usersByDay: {
            date: any;
            count: number;
        }[];
        ordersByStatus: {
            name: any;
            value: number;
        }[];
        categoryBreakdown: {
            name: any;
            value: number;
        }[];
        topSellers: {
            id: any;
            name: any;
            revenue: number;
            orderCount: number;
        }[];
        summary: {
            periodRevenue: number;
            periodOrders: number;
            periodUsers: number;
            days: number;
        };
    }>;
    globalSearch(query: string): Promise<{
        users: User[];
        products: Product[];
        orders: Order[];
    }>;
}
