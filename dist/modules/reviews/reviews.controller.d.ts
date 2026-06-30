import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly svc;
    constructor(svc: ReviewsService);
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
