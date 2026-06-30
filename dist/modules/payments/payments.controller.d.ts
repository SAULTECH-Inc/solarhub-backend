import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly svc;
    constructor(svc: PaymentsService);
    initiatePayment(user: any, body: {
        orderId: string;
        currency: string;
        method?: string;
        customerName?: string;
    }): Promise<{
        provider: string;
        reference: string;
        paymentUrl?: string;
        clientSecret?: string;
    }>;
    verifyPaystack(ref: string): Promise<import("./payment.entity").Payment>;
    verifyFlutterwave(txId: string, txRef: string): Promise<import("./payment.entity").Payment>;
    getOrderPayments(id: string): Promise<import("./payment.entity").Payment[]>;
    refund(id: string, amount?: number, reason?: string): Promise<import("./payment.entity").Payment>;
    paystackWebhook(req: RawBodyRequest<Request>, sig: string): Promise<void>;
    stripeWebhook(req: RawBodyRequest<Request>, sig: string): Promise<void>;
    flutterwaveWebhook(req: RawBodyRequest<Request>, sig: string): Promise<void>;
    paddleWebhook(req: RawBodyRequest<Request>, sig: string): Promise<void>;
    getStats(): Promise<{
        total: number;
        success: number;
        failed: number;
        revenue: any[];
    }>;
}
