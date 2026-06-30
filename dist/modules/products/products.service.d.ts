import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';
import { CartItem } from '../cart/cart.entity';
import { OrderItem } from '../orders/order.entity';
import { RedisService } from '../redis/redis.service';
import { UploadsService } from '../uploads/uploads.service';
export declare const LISTING_LIMITS: Record<string, number>;
export interface ProductFilters {
    category?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    city?: string;
    state?: string;
    search?: string;
    featured?: boolean;
    currency?: string;
}
export declare class ProductsService {
    private readonly repo;
    private readonly catRepo;
    private readonly cartItemRepo;
    private readonly orderItemRepo;
    private readonly redis;
    private readonly uploads;
    private readonly logger;
    constructor(repo: Repository<Product>, catRepo: Repository<Category>, cartItemRepo: Repository<CartItem>, orderItemRepo: Repository<OrderItem>, redis: RedisService, uploads: UploadsService);
    create(dto: Partial<Product> & {
        categorySlug?: string;
    }, seller: User): Promise<Product>;
    update(id: string, dto: Partial<Product>, userId: string, role: string): Promise<Product>;
    delete(id: string, userId: string, role: string): Promise<void>;
    findById(id: string, incrementView?: boolean): Promise<Product>;
    findBySlug(slug: string): Promise<Product>;
    search(filters: ProductFilters, page: number, limit: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<Product>>;
    getFeatured(limit?: number): Promise<Product[]>;
    getByCategory(categorySlug: string, page: number, limit: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<Product>>;
    getSellerProducts(sellerId: string, page: number, limit: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<Product>>;
    getListingQuota(seller: User): Promise<{
        tier: string;
        used: number;
        limit: number;
        remaining: number;
        canPost: boolean;
    }>;
    getStats(): Promise<{
        total: number;
        active: number;
        pending: number;
    }>;
    updateRating(productId: string, avg: number, count: number): Promise<void>;
    decrementStock(productId: string, qty: number): Promise<void>;
    incrementSales(productId: string, qty: number): Promise<void>;
    approve(id: string): Promise<Product>;
    getEditLockStatus(productId: string): Promise<{
        locked: boolean;
        reason?: string;
    }>;
    private invalidateProductCache;
}
