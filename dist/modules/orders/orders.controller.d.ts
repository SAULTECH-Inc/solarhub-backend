import { OrdersService } from './orders.service';
import { OrderStatus } from './order.entity';
export declare class OrdersController {
    private readonly svc;
    constructor(svc: OrdersService);
    placeOrder(user: any, dto: any): Promise<import("./order.entity").Order>;
    getMyOrders(uid: string, page?: number, limit?: number, status?: OrderStatus): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./order.entity").Order>>;
    getSellerOrders(uid: string, page?: number, limit?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./order.entity").Order>>;
    getOrder(id: string, user: any): Promise<import("./order.entity").Order>;
    advanceStatus(id: string, user: any, note?: string): Promise<import("./order.entity").Order>;
    cancel(id: string, user: any, reason?: string): Promise<import("./order.entity").Order>;
    getAllOrders(page?: number, limit?: number, status?: string, search?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./order.entity").Order>>;
    getStats(): Promise<{
        total: number;
        revenue: number;
        byStatus: any;
    }>;
}
