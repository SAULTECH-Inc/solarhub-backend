import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
export declare class EmailProcessor {
    private readonly mailer;
    private readonly logger;
    constructor(mailer: MailerService);
    handleEmailVerification(job: Job<{
        to: string;
        firstName: string;
        otp: string;
    }>): Promise<void>;
    handleWelcome(job: Job<{
        to: string;
        firstName: string;
    }>): Promise<void>;
    handlePasswordReset(job: Job<{
        to: string;
        firstName: string;
        resetUrl: string;
    }>): Promise<void>;
    handlePasswordChanged(job: Job<{
        to: string;
        firstName: string;
    }>): Promise<void>;
    handleOrderConfirmation(job: Job<{
        to: string;
        firstName: string;
        order: any;
    }>): Promise<void>;
    handleOrderStatus(job: Job<{
        to: string;
        firstName: string;
        order: any;
        status: string;
    }>): Promise<void>;
    handlePaymentReceipt(job: Job<{
        to: string;
        firstName: string;
        payment: any;
    }>): Promise<void>;
    handlePaymentFailed(job: Job<{
        to: string;
        firstName: string;
        payment: any;
    }>): Promise<void>;
    handleProductApproved(job: Job<{
        to: string;
        firstName: string;
        product: any;
    }>): Promise<void>;
}
