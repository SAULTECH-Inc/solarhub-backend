import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { ProductsService } from '../products/products.service';
export declare class ReviewsService {
    private readonly repo;
    private readonly products;
    constructor(repo: Repository<Review>, products: ProductsService);
    create(userId: string, dto: {
        productId: string;
        rating: number;
        title?: string;
        body?: string;
        images?: string[];
        orderId?: string;
        orderItemId?: string;
    }): Promise<Review>;
    getProductReviews(productId: string, page: number, limit: number): Promise<{
        avg: number;
        breakdown: any[];
        data: Review[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    replyToReview(reviewId: string, sellerId: string, reply: string): Promise<Review>;
    markHelpful(reviewId: string): Promise<void>;
    delete(reviewId: string, userId: string, role: string): Promise<void>;
    private recalculateProductRating;
}
