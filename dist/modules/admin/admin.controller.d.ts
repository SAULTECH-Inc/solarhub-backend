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
    getPendingProducts(): Promise<import("../products/product.entity").Product[]>;
    moderate(id: string, action: 'approve' | 'reject', reason?: string): Promise<import("../products/product.entity").Product>;
    setFeatured(id: string, featured: boolean, badge?: string): Promise<void>;
    productStats(): Promise<{
        total: number;
        active: number;
        pending: number;
    }>;
    listOrders(p?: number, l?: number, status?: string, search?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("../orders/order.entity").Order>>;
    advanceOrder(id: string, note?: string): Promise<import("../orders/order.entity").Order>;
    orderStats(): Promise<{
        total: number;
        revenue: number;
        byStatus: any;
    }>;
}
