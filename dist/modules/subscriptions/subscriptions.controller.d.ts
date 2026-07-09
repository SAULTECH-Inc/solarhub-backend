import { SubscriptionsService } from './subscriptions.service';
import { InvoiceStatus } from './subscription-invoice.entity';
export declare class SubscriptionsController {
    private readonly svc;
    constructor(svc: SubscriptionsService);
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
    subscribe(user: any, plan: string, currency?: string): Promise<{
        provider: string;
        reference: string;
        paymentUrl?: string;
        clientSecret?: string;
    }>;
    verifyPaystack(reference: string): Promise<import("./subscription-invoice.entity").SubscriptionInvoice>;
    cancel(userId: string): Promise<{
        message: string;
    }>;
    getInvoices(userId: string, page?: number, limit?: number): Promise<{
        data: import("./subscription-invoice.entity").SubscriptionInvoice[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getInvoice(id: string, userId: string): Promise<import("./subscription-invoice.entity").SubscriptionInvoice>;
    adminListInvoices(p?: number, l?: number, plan?: string, status?: InvoiceStatus): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./subscription-invoice.entity").SubscriptionInvoice>>;
}
