import { Repository } from 'typeorm';
import { CartItem } from './cart.entity';
import { ProductsService } from '../products/products.service';
import { RedisService } from '../redis/redis.service';
export interface CartSummary {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    currency: string;
}
export declare class CartService {
    private readonly repo;
    private readonly products;
    private readonly redis;
    constructor(repo: Repository<CartItem>, products: ProductsService, redis: RedisService);
    addItem(userId: string, productId: string, quantity?: number): Promise<CartSummary>;
    updateQty(userId: string, itemId: string, quantity: number): Promise<CartSummary>;
    removeItem(userId: string, itemId: string): Promise<CartSummary>;
    clearCart(userId: string): Promise<void>;
    getCart(userId: string): Promise<CartSummary>;
    mergeGuestCart(userId: string, sessionId: string): Promise<void>;
    getItemsForOrder(userId: string): Promise<CartItem[]>;
}
