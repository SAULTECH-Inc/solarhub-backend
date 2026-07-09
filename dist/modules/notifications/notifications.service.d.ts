import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Notification, NotificationType } from './notification.entity';
import { PushToken } from './push-token.entity';
import { FirebaseAdminService } from './firebase-admin.service';
import { User } from '../users/user.entity';
export declare class NotificationsService {
    private readonly repo;
    private readonly pushTokenRepo;
    private readonly emailQueue;
    private readonly mailer;
    private readonly firebase;
    private readonly logger;
    constructor(repo: Repository<Notification>, pushTokenRepo: Repository<PushToken>, emailQueue: Queue, mailer: MailerService, firebase: FirebaseAdminService);
    registerPushToken(userId: string, token: string, platform: string): Promise<void>;
    unregisterPushToken(userId: string, token: string): Promise<void>;
    private sendPush;
    private sendEmail;
    sendEmailVerification(user: User, otp: string): Promise<void>;
    sendVerificationReminder(user: User, otp: string): Promise<void>;
    sendWelcomeEmail(user: User): Promise<void>;
    sendPasswordReset(user: User, token: string): Promise<void>;
    sendPasswordChanged(user: User): Promise<void>;
    sendOrderConfirmation(user: User, order: any): Promise<void>;
    sendOrderStatusUpdate(user: User, order: any, status: string): Promise<void>;
    sendPaymentReceipt(user: User, payment: any): Promise<void>;
    sendPaymentFailed(user: User, payment: any): Promise<void>;
    sendProductApproved(user: User, product: any): Promise<void>;
    sendNewChatMessage(user: User, fromName: string, preview: string): Promise<void>;
    createInApp(userId: string, type: NotificationType, payload: {
        title: string;
        body: string;
        data?: any;
    }): Promise<Notification>;
    getUserNotifications(userId: string, page: number, limit: number): Promise<{
        unread: number;
        data: Notification[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    markRead(userId: string, ids: string[]): Promise<void>;
    markAllRead(userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
}
