import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly svc;
    constructor(svc: ReviewsService);
    getAllReviews(p?: number, l?: number, rating?: string, search?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
        productName: any;
        id: string;
        productId: string;
        userId: string;
        orderId: string;
        orderItemId: string;
        rating: number;
        title: string;
        body: string;
        images: string[];
        sellerReply: string;
        sellerRepliedAt: Date;
        verified: boolean;
        helpfulCount: number;
        user: import("../users/user.entity").User;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    getProductReviews(pid: string, p?: number, l?: number): Promise<{
        avg: number;
        breakdown: any[];
        data: import("./review.entity").Review[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    create(uid: string, dto: any): Promise<import("./review.entity").Review>;
    reply(id: string, uid: string, reply: string): Promise<import("./review.entity").Review>;
    markHelpful(id: string): Promise<void>;
    delete(id: string, user: any): Promise<void>;
}
