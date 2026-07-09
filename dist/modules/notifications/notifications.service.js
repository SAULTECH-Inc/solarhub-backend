"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bull_1 = require("@nestjs/bull");
const mailer_1 = require("@nestjs-modules/mailer");
const notification_entity_1 = require("./notification.entity");
const push_token_entity_1 = require("./push-token.entity");
const firebase_admin_service_1 = require("./firebase-admin.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(repo, pushTokenRepo, emailQueue, mailer, firebase) {
        this.repo = repo;
        this.pushTokenRepo = pushTokenRepo;
        this.emailQueue = emailQueue;
        this.mailer = mailer;
        this.firebase = firebase;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async registerPushToken(userId, token, platform) {
        await this.pushTokenRepo.upsert({ userId, token, platform }, { conflictPaths: ['token'] });
    }
    async unregisterPushToken(userId, token) {
        await this.pushTokenRepo.delete({ userId, token });
    }
    async sendPush(userId, title, body, data = {}) {
        if (!this.firebase.isReady())
            return;
        const tokens = await this.pushTokenRepo.find({ where: { userId }, select: ['token'] });
        if (!tokens.length)
            return;
        await this.firebase.sendMulticast(tokens.map(t => t.token), title, body, data);
    }
    async sendEmail(job, data, opts) {
        await this.emailQueue.add(job, data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            ...opts,
        });
    }
    async sendEmailVerification(user, otp) {
        await this.mailer.sendMail({
            to: user.email,
            subject: `${otp} — Verify your Solar Maket email`,
            template: 'email-verification',
            context: { firstName: user.firstName, otp, year: new Date().getFullYear() },
        });
    }
    async sendVerificationReminder(user, otp) {
        await this.mailer.sendMail({
            to: user.email,
            subject: `${otp} — Complete your Solar Maket signup`,
            template: 'verification-reminder',
            context: { firstName: user.firstName, otp, year: new Date().getFullYear() },
        });
    }
    async sendWelcomeEmail(user) {
        await this.sendEmail('welcome', {
            to: user.email, firstName: user.firstName,
        }, { delay: 5000 });
    }
    async sendPasswordReset(user, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await this.mailer.sendMail({
            to: user.email,
            subject: 'Reset your Solar Maket password',
            template: 'password-reset',
            context: { firstName: user.firstName, resetUrl, year: new Date().getFullYear() },
        });
    }
    async sendPasswordChanged(user) {
        await this.sendEmail('password-changed', {
            to: user.email, firstName: user.firstName,
        });
    }
    async sendOrderConfirmation(user, order) {
        await this.sendEmail('order-confirmation', {
            to: user.email, firstName: user.firstName, order,
        });
        await this.createInApp(user.id, notification_entity_1.NotificationType.ORDER_PLACED, {
            title: `Order ${order.orderNumber} Placed`,
            body: `Your order for ${order.itemCount} item(s) totalling ₦${order.total.toLocaleString()} has been placed.`,
            data: { orderId: order.id, orderNumber: order.orderNumber },
        });
    }
    async sendOrderStatusUpdate(user, order, status) {
        await this.sendEmail('order-status', {
            to: user.email, firstName: user.firstName, order, status,
        });
        const typeMap = {
            confirmed: notification_entity_1.NotificationType.ORDER_CONFIRMED,
            dispatched: notification_entity_1.NotificationType.ORDER_SHIPPED,
            in_transit: notification_entity_1.NotificationType.ORDER_SHIPPED,
            out_delivery: notification_entity_1.NotificationType.ORDER_SHIPPED,
            delivered: notification_entity_1.NotificationType.ORDER_DELIVERED,
        };
        await this.createInApp(user.id, typeMap[status] || notification_entity_1.NotificationType.SYSTEM, {
            title: `Order ${order.orderNumber} — ${status.replace(/_/g, ' ')}`,
            body: `Your order status has been updated to: ${status.replace(/_/g, ' ')}`,
            data: { orderId: order.id },
        });
    }
    async sendPaymentReceipt(user, payment) {
        await this.sendEmail('payment-receipt', {
            to: user.email, firstName: user.firstName, payment,
        });
        await this.createInApp(user.id, notification_entity_1.NotificationType.PAYMENT_SUCCESS, {
            title: 'Payment Successful',
            body: `Payment of ₦${payment.amount.toLocaleString()} confirmed for Order ${payment.orderNumber}.`,
            data: { paymentId: payment.id },
        });
    }
    async sendPaymentFailed(user, payment) {
        await this.sendEmail('payment-failed', {
            to: user.email, firstName: user.firstName, payment,
        });
        await this.createInApp(user.id, notification_entity_1.NotificationType.PAYMENT_FAILED, {
            title: 'Payment Failed',
            body: `Payment for Order ${payment.orderNumber} failed. Please retry.`,
            data: { paymentId: payment.id },
        });
    }
    async sendProductApproved(user, product) {
        await this.sendEmail('product-approved', {
            to: user.email, firstName: user.firstName, product,
        });
        await this.createInApp(user.id, notification_entity_1.NotificationType.PRODUCT_APPROVED, {
            title: 'Product Approved',
            body: `Your product "${product.name}" is now live on Solar Maket!`,
            data: { productId: product.id },
        });
    }
    async sendNewChatMessage(user, fromName, preview) {
        await this.createInApp(user.id, notification_entity_1.NotificationType.NEW_MESSAGE, {
            title: `New message from ${fromName}`,
            body: preview.slice(0, 120),
            data: {},
        });
    }
    async createInApp(userId, type, payload) {
        const notif = this.repo.create({ userId, type, ...payload });
        const saved = await this.repo.save(notif);
        this.sendPush(userId, payload.title, payload.body, {
            type,
            ...(payload.data ? Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)])) : {}),
        }).catch(e => this.logger.warn('Push send failed', e?.message));
        return saved;
    }
    async getUserNotifications(userId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.repo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip, take,
        });
        const unread = await this.repo.count({ where: { userId, read: false } });
        return { ...(0, pagination_util_1.paginate)(data, total, page, limit), unread };
    }
    async markRead(userId, ids) {
        await this.repo.update(ids.length ? ids.map(id => ({ id, userId })) : { userId }, { read: true, readAt: new Date() });
    }
    async markAllRead(userId) {
        await this.repo.update({ userId, read: false }, { read: true, readAt: new Date() });
    }
    async getUnreadCount(userId) {
        return this.repo.count({ where: { userId, read: false } });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(push_token_entity_1.PushToken)),
    __param(2, (0, bull_1.InjectQueue)('email')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object, mailer_1.MailerService,
        firebase_admin_service_1.FirebaseAdminService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map