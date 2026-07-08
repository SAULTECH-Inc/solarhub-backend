import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { UserStatus } from '../users/user.entity';
export declare class AdminController {
    private readonly svc;
    private readonly users;
    private readonly products;
    private readonly orders;
    constructor(svc: AdminService, users: UsersService, products: ProductsService, orders: OrdersService);
    seedSuperAdmin(key: string, email: string, password?: string): Promise<{
        created: boolean;
        email: string;
        message: string;
    }>;
    getDashboard(): Promise<import("./admin.service").DashboardStats>;
    getHealth(): Promise<{
        status: string;
        database: string;
        redis: string;
        timestamp: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        nodeVersion: string;
    }>;
    globalSearch(q: string): Promise<{
        users: import("../users/user.entity").User[];
        products: import("../products/product.entity").Product[];
        orders: import("../orders/order.entity").Order[];
    }>;
    getAnalytics(days?: number): Promise<{
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
        status: import("../payments/payment.entity").TxStatus;
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
    listUsers(p?: number, l?: number, role?: string, status?: string, search?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../users/user.entity").User>>;
    updateUserStatus(id: string, status: UserStatus): Promise<import("../users/user.entity").User>;
    verifySeller(id: string, approved: boolean): Promise<import("../users/user.entity").User>;
    userStats(): Promise<{
        total: number;
        sellers: number;
        engineers: number;
        buyers: number;
        admins: number;
    }>;
    getUserDetail(id: string): Promise<{
        user: import("../users/user.entity").User;
        recentOrders: import("../orders/order.entity").Order[];
        totalOrders: number;
        sellerStats: any;
    }>;
    getPendingProducts(): Promise<import("../products/product.entity").Product[]>;
    moderate(id: string, action: 'approve' | 'reject', reason?: string): Promise<import("../products/product.entity").Product>;
    setFeatured(id: string, featured: boolean, badge?: string): Promise<void>;
    productStats(): Promise<{
        total: number;
        active: number;
        pending: number;
    }>;
    listOrders(p?: number, l?: number, status?: string, search?: string, paymentStatus?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../orders/order.entity").Order>>;
    advanceOrder(id: string, note?: string): Promise<import("../orders/order.entity").Order>;
    orderStats(): Promise<{
        total: number;
        revenue: number;
        byStatus: any;
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
            status: import("../orders/order.entity").OrderStatus;
            order: import("../orders/order.entity").Order;
            reviewed: boolean;
            createdAt: Date;
        }[];
        id: string;
        orderNumber: string;
        buyerId: string;
        buyer: import("../users/user.entity").User;
        items: import("../orders/order.entity").OrderItem[];
        status: import("../orders/order.entity").OrderStatus;
        paymentStatus: import("../orders/order.entity").PaymentStatus;
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
    getFlaggedUsers(p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../users/user.entity").User>>;
    flagUser(id: string, reason: string): Promise<import("../users/user.entity").User>;
    unflagUser(id: string): Promise<import("../users/user.entity").User>;
    getRiskyPayments(p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../payments/payment.entity").Payment>>;
}
