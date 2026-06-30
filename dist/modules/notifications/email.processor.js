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
var EmailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const mailer_1 = require("@nestjs-modules/mailer");
const common_1 = require("@nestjs/common");
let EmailProcessor = EmailProcessor_1 = class EmailProcessor {
    constructor(mailer) {
        this.mailer = mailer;
        this.logger = new common_1.Logger(EmailProcessor_1.name);
    }
    async handleEmailVerification(job) {
        const { to, firstName, otp } = job.data;
        await this.mailer.sendMail({
            to, subject: `${otp} — Verify your Solar Maket email`,
            template: 'email-verification',
            context: { firstName, otp, year: new Date().getFullYear() },
        });
        this.logger.log(`Verification email sent to ${to}`);
    }
    async handleWelcome(job) {
        const { to, firstName } = job.data;
        await this.mailer.sendMail({
            to, subject: '🌞 Welcome to Solar Maket Nigeria!',
            template: 'welcome',
            context: { firstName, year: new Date().getFullYear() },
        });
    }
    async handlePasswordReset(job) {
        const { to, firstName, resetUrl } = job.data;
        await this.mailer.sendMail({
            to, subject: 'Reset your Solar Maket password',
            template: 'password-reset',
            context: { firstName, resetUrl, year: new Date().getFullYear() },
        });
    }
    async handlePasswordChanged(job) {
        const { to, firstName } = job.data;
        await this.mailer.sendMail({
            to, subject: 'Your Solar Maket password has been changed',
            template: 'password-changed',
            context: { firstName, year: new Date().getFullYear() },
        });
    }
    async handleOrderConfirmation(job) {
        const { to, firstName, order } = job.data;
        await this.mailer.sendMail({
            to, subject: `Order ${order.orderNumber} Confirmed — Solar Maket`,
            template: 'order-confirmation',
            context: { firstName, order, year: new Date().getFullYear() },
        });
    }
    async handleOrderStatus(job) {
        const { to, firstName, order, status } = job.data;
        const subjects = {
            confirmed: `Order ${order.orderNumber} — Payment Confirmed`,
            dispatched: `Order ${order.orderNumber} — Dispatched from Seller`,
            in_transit: `Order ${order.orderNumber} — In Transit`,
            out_delivery: `Order ${order.orderNumber} — Out for Delivery`,
            delivered: `Order ${order.orderNumber} — Delivered! 🎉`,
        };
        await this.mailer.sendMail({
            to, subject: subjects[status] || `Order ${order.orderNumber} Update`,
            template: 'order-status',
            context: { firstName, order, status, year: new Date().getFullYear() },
        });
    }
    async handlePaymentReceipt(job) {
        const { to, firstName, payment } = job.data;
        await this.mailer.sendMail({
            to, subject: `Payment Receipt — ₦${payment.amount.toLocaleString()}`,
            template: 'payment-receipt',
            context: { firstName, payment, year: new Date().getFullYear() },
        });
    }
    async handlePaymentFailed(job) {
        const { to, firstName, payment } = job.data;
        await this.mailer.sendMail({
            to, subject: `Payment Failed — Order ${payment.orderNumber}`,
            template: 'payment-failed',
            context: { firstName, payment, year: new Date().getFullYear() },
        });
    }
    async handleProductApproved(job) {
        const { to, firstName, product } = job.data;
        await this.mailer.sendMail({
            to, subject: `Your product "${product.name}" is live on Solar Maket! ☀️`,
            template: 'product-approved',
            context: { firstName, product, year: new Date().getFullYear() },
        });
    }
};
exports.EmailProcessor = EmailProcessor;
__decorate([
    (0, bull_1.Process)('email-verification'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleEmailVerification", null);
__decorate([
    (0, bull_1.Process)('welcome'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleWelcome", null);
__decorate([
    (0, bull_1.Process)('password-reset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handlePasswordReset", null);
__decorate([
    (0, bull_1.Process)('password-changed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handlePasswordChanged", null);
__decorate([
    (0, bull_1.Process)('order-confirmation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleOrderConfirmation", null);
__decorate([
    (0, bull_1.Process)('order-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleOrderStatus", null);
__decorate([
    (0, bull_1.Process)('payment-receipt'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handlePaymentReceipt", null);
__decorate([
    (0, bull_1.Process)('payment-failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handlePaymentFailed", null);
__decorate([
    (0, bull_1.Process)('product-approved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleProductApproved", null);
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([
    (0, bull_1.Processor)('email'),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map