import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
export declare class CartItem {
    id: string;
    userId: string;
    sessionId: string;
    productId: string;
    quantity: number;
    priceAtAdd: number;
    currency: string;
    user: User;
    product: Product;
    createdAt: Date;
    updatedAt: Date;
}
