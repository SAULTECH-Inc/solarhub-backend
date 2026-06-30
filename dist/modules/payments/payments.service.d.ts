import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from './payment.entity';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
export declare class PaymentsService {
    private readonly repo;
    private readonly cfg;
    private readonly orders;
    private readonly notif;
    private readonly redis;
    private readonly subscriptions;
    private readonly logger;
    private readonly stripe;
    constructor(repo: Repository<Payment>, cfg: ConfigService, orders: OrdersService, notif: NotificationsService, redis: RedisService, subscriptions: SubscriptionsService);
    initiatePayment(orderId: string, userId: string, currency: string, email: string, method?: string, customerName?: string): Promise<{
        provider: string;
        reference: string;
        paymentUrl?: string;
        clientSecret?: string;
    }>;
    private initFlutterwave;
    verifyFlutterwave(transactionId: string, txRef: string): Promise<Payment>;
    handleFlutterwaveWebhook(payload: Buffer, signature: string): Promise<void>;
    private initPaddle;
    handlePaddleWebhook(payload: Buffer, signature: string): Promise<void>;
    private initPaystack;
    verifyPaystack(reference: string): Promise<Payment>;
    handlePaystackWebhook(payload: Buffer, signature: string): Promise<void>;
    private initStripe;
    handleStripeWebhook(payload: Buffer, signature: string): Promise<void>;
    private handleSuccessfulPayment;
    refund(paymentId: string, amount?: number, reason?: string): Promise<Payment>;
    private handleRefundWebhook;
    getPaymentByOrder(orderId: string): Promise<Payment[]>;
    getStats(): Promise<{
        total: number;
        success: number;
        failed: number;
        revenue: any[];
    }>;
}
