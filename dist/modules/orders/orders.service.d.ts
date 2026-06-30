import { Repository } from 'typeorm';
import { Order, OrderItem, OrderStatus } from './order.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
interface CreateOrderDto {
    deliveryAddress: Order['deliveryAddress'];
    deliveryMethod: string;
    deliveryFee?: number;
    paymentMethod?: string;
    buyerNote?: string;
    currency?: string;
}
export declare class OrdersService {
    private readonly repo;
    private readonly itemRepo;
    private readonly cart;
    private readonly products;
    private readonly notif;
    private readonly redis;
    private readonly logger;
    constructor(repo: Repository<Order>, itemRepo: Repository<OrderItem>, cart: CartService, products: ProductsService, notif: NotificationsService, redis: RedisService);
    placeOrder(buyerId: string, dto: CreateOrderDto, buyer: any): Promise<Order>;
    findById(id: string, userId?: string, role?: string): Promise<Order>;
    getUserOrders(buyerId: string, page: number, limit: number, status?: OrderStatus): Promise<import("../../common/utils/pagination.util").PaginatedResult<Order>>;
    getSellerOrders(sellerId: string, page: number, limit: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<Order>>;
    getAllOrders(page: number, limit: number, status?: string, search?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<Order>>;
    advanceStatus(orderId: string, userId: string, role: string, note?: string): Promise<Order>;
    cancelOrder(orderId: string, userId: string, role: string, reason?: string): Promise<Order>;
    markPaid(orderId: string, reference: string, gateway: string): Promise<Order>;
    getOrderStats(): Promise<{
        total: number;
        revenue: number;
        byStatus: any;
    }>;
}
export {};
