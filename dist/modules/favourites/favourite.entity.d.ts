import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
export declare class Favourite {
    id: string;
    userId: string;
    productId: string;
    user: User;
    product: Product;
    createdAt: Date;
}
