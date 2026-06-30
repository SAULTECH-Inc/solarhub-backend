import { User } from '../users/user.entity';
export declare class Review {
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
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
