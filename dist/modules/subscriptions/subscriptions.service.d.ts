import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SubscriptionInvoice } from './subscription-invoice.entity';
import { User } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';
export declare const SUBSCRIPTION_PLANS: Record<string, {
    name: string;
    listingLimit: number;
    priceNGN: number;
    priceUSD: number;
    billingCycleDays: number;
    features: string[];
    includesEngineer?: boolean;
}>;
export declare class SubscriptionsService {
    private readonly invoiceRepo;
    private readonly userRepo;
    private readonly cfg;
    private readonly redis;
    private readonly logger;
    private readonly stripe;
    constructor(invoiceRepo: Repository<SubscriptionInvoice>, userRepo: Repository<User>, cfg: ConfigService, redis: RedisService);
    getPlans(): {
        listingLimit: number;
        name: string;
        priceNGN: number;
        priceUSD: number;
        billingCycleDays: number;
        features: string[];
        includesEngineer?: boolean;
        key: string;
    }[];
    subscribe(user: User, plan: string, currency: string): Promise<{
        provider: string;
        reference: string;
        paymentUrl?: string;
        clientSecret?: string;
    }>;
    private initPaystack;
    private initStripe;
    handleWebhookSuccess(invoiceId: string, gatewayTxId: string, gatewayData: any): Promise<void>;
    cancelSubscription(userId: string): Promise<{
        message: string;
    }>;
    getInvoices(userId: string, page?: number, limit?: number): Promise<{
        data: SubscriptionInvoice[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getInvoiceById(id: string, userId: string): Promise<SubscriptionInvoice>;
    verifyPaystackReference(reference: string): Promise<SubscriptionInvoice>;
}
