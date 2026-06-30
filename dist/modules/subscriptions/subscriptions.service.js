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
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = exports.SUBSCRIPTION_PLANS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
const subscription_invoice_entity_1 = require("./subscription-invoice.entity");
const user_entity_1 = require("../users/user.entity");
const redis_service_1 = require("../redis/redis.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
exports.SUBSCRIPTION_PLANS = {
    free: {
        name: 'Free',
        listingLimit: 5,
        priceNGN: 0,
        priceUSD: 0,
        billingCycleDays: 0,
        features: ['5 product listings', 'Basic analytics', 'Buyer messaging'],
    },
    basic: {
        name: 'Basic',
        listingLimit: 20,
        priceNGN: 5_000,
        priceUSD: 4,
        billingCycleDays: 30,
        features: ['20 product listings', 'Basic analytics', 'Buyer messaging', 'Priority support'],
    },
    pro: {
        name: 'Pro',
        listingLimit: 50,
        priceNGN: 15_000,
        priceUSD: 12,
        billingCycleDays: 30,
        features: ['50 product listings', 'Advanced analytics', 'Featured placement (3 slots)', 'Buyer messaging', 'Priority support'],
    },
    pro_engineer: {
        name: 'Pro + Engineer',
        listingLimit: 50,
        priceNGN: 20_000,
        priceUSD: 16,
        billingCycleDays: 30,
        includesEngineer: true,
        features: ['50 product listings', 'Engineer marketplace profile', 'Advanced analytics', 'Featured placement (3 slots)', 'Priority support'],
    },
    enterprise: {
        name: 'Enterprise',
        listingLimit: Infinity,
        priceNGN: 50_000,
        priceUSD: 40,
        billingCycleDays: 30,
        features: ['Unlimited listings', 'Engineer marketplace profile', 'Full analytics suite', 'Unlimited featured placement', 'Dedicated account manager'],
    },
};
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    constructor(invoiceRepo, userRepo, cfg, redis) {
        this.invoiceRepo = invoiceRepo;
        this.userRepo = userRepo;
        this.cfg = cfg;
        this.redis = redis;
        this.logger = new common_1.Logger(SubscriptionsService_1.name);
        this.stripe = new stripe_1.default(cfg.get('stripe.secretKey'), { apiVersion: '2025-02-24.acacia' });
    }
    getPlans() {
        return Object.entries(exports.SUBSCRIPTION_PLANS).map(([key, plan]) => ({
            key,
            ...plan,
            listingLimit: isFinite(plan.listingLimit) ? plan.listingLimit : null,
        }));
    }
    async subscribe(user, plan, currency) {
        if (plan === 'free')
            throw new common_1.BadRequestException('Cannot subscribe to the free plan');
        const planConfig = exports.SUBSCRIPTION_PLANS[plan];
        if (!planConfig)
            throw new common_1.BadRequestException(`Unknown plan: ${plan}`);
        if (!user.isSeller && !user.isEngineer) {
            throw new common_1.ForbiddenException('Only sellers or engineers can subscribe to a paid plan');
        }
        const cur = currency.toUpperCase();
        const amount = cur === 'NGN' ? planConfig.priceNGN : planConfig.priceUSD;
        const reference = `SH-SUB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const invoice = await this.invoiceRepo.save(this.invoiceRepo.create({
            userId: user.id,
            plan,
            amount,
            currency: cur,
            reference,
            status: subscription_invoice_entity_1.InvoiceStatus.PENDING,
        }));
        if (['NGN', 'GHS'].includes(cur)) {
            return this.initPaystack(invoice, user.email, amount, cur, reference);
        }
        else {
            return this.initStripe(invoice, user.email, amount, cur, reference);
        }
    }
    async initPaystack(invoice, email, amount, currency, reference) {
        const secretKey = this.cfg.get('paystack.secretKey');
        const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                amount: (0, pagination_util_1.toSubunit)(amount, currency),
                currency,
                reference,
                callback_url: `${this.cfg.get('app.frontendUrl')}/subscription/callback`,
                metadata: {
                    subscriptionInvoiceId: invoice.id,
                    plan: invoice.plan,
                    userId: invoice.userId,
                },
            }),
        });
        const data = await res.json();
        if (!data.status)
            throw new common_1.BadRequestException(data.message || 'Paystack init failed');
        await this.invoiceRepo.update(invoice.id, { gatewayTransactionId: data.data.access_code });
        return { provider: 'paystack', reference, paymentUrl: data.data.authorization_url };
    }
    async initStripe(invoice, email, amount, currency, reference) {
        const amountCents = (0, pagination_util_1.toSubunit)(amount, currency);
        const intent = await this.stripe.paymentIntents.create({
            amount: amountCents,
            currency: currency.toLowerCase(),
            receipt_email: email,
            metadata: { reference, subscriptionInvoiceId: invoice.id, plan: invoice.plan, userId: invoice.userId },
            automatic_payment_methods: { enabled: true },
        });
        await this.invoiceRepo.update(invoice.id, { gatewayTransactionId: intent.id });
        return { provider: 'stripe', reference, clientSecret: intent.client_secret };
    }
    async handleWebhookSuccess(invoiceId, gatewayTxId, gatewayData) {
        const idempotencyKey = `webhook:sub:${invoiceId}`;
        const alreadyDone = await this.redis.get(idempotencyKey);
        if (alreadyDone)
            return;
        await this.redis.set(idempotencyKey, '1', 86400);
        const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
        if (!invoice || invoice.status === subscription_invoice_entity_1.InvoiceStatus.PAID)
            return;
        const now = new Date();
        const plan = exports.SUBSCRIPTION_PLANS[invoice.plan];
        const periodEnd = new Date(now.getTime() + (plan?.billingCycleDays ?? 30) * 24 * 60 * 60 * 1000);
        await this.invoiceRepo.update(invoice.id, {
            status: subscription_invoice_entity_1.InvoiceStatus.PAID,
            paidAt: now,
            periodStart: now,
            periodEnd,
            gatewayTransactionId: gatewayTxId,
            gatewayData,
        });
        await this.userRepo.update(invoice.userId, {
            subscriptionTier: invoice.plan,
            subscriptionStatus: 'active',
            subscriptionExpiresAt: periodEnd,
        });
        this.logger.log(`Subscription activated: user=${invoice.userId} plan=${invoice.plan} expires=${periodEnd.toISOString()}`);
    }
    async cancelSubscription(userId) {
        await this.userRepo.update(userId, { subscriptionStatus: 'canceled' });
        return { message: 'Subscription cancelled. Your plan remains active until the end of the billing period.' };
    }
    async getInvoices(userId, page = 1, limit = 10) {
        const [data, total] = await this.invoiceRepo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async getInvoiceById(id, userId) {
        const invoice = await this.invoiceRepo.findOne({ where: { id } });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        if (invoice.userId !== userId)
            throw new common_1.ForbiddenException('Not your invoice');
        return invoice;
    }
    async verifyPaystackReference(reference) {
        const secretKey = this.cfg.get('paystack.secretKey');
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${secretKey}` },
        });
        const data = await res.json();
        if (!data.status || data.data.status !== 'success') {
            throw new common_1.BadRequestException('Payment not confirmed');
        }
        const invoiceId = data.data.metadata?.subscriptionInvoiceId;
        if (!invoiceId)
            throw new common_1.BadRequestException('Not a subscription payment');
        await this.handleWebhookSuccess(invoiceId, data.data.id.toString(), data.data);
        return this.invoiceRepo.findOne({ where: { id: invoiceId } });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_invoice_entity_1.SubscriptionInvoice)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        redis_service_1.RedisService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map