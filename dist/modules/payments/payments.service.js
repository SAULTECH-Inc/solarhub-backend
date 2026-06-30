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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
const crypto = require("crypto");
const payment_entity_1 = require("./payment.entity");
const orders_service_1 = require("../orders/orders.service");
const notifications_service_1 = require("../notifications/notifications.service");
const redis_service_1 = require("../redis/redis.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
const FLW_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'XOF', 'RWF'];
const PADDLE_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const STRIPE_CURRENCIES = ['CNY'];
const PAYSTACK_CURRENCIES = ['NGN', 'USD', 'GHS'];
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(repo, cfg, orders, notif, redis, subscriptions) {
        this.repo = repo;
        this.cfg = cfg;
        this.orders = orders;
        this.notif = notif;
        this.redis = redis;
        this.subscriptions = subscriptions;
        this.logger = new common_1.Logger(PaymentsService_1.name);
        this.stripe = new stripe_1.default(cfg.get('stripe.secretKey'), { apiVersion: '2025-02-24.acacia' });
    }
    async initiatePayment(orderId, userId, currency, email, method, customerName) {
        const order = await this.orders.findById(orderId, userId, 'buyer');
        if (order.paymentStatus === 'paid')
            throw new common_1.BadRequestException('Order already paid');
        const reference = `SH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const cur = currency.toUpperCase();
        let provider;
        if (FLW_CURRENCIES.includes(cur))
            provider = payment_entity_1.PaymentProvider.FLUTTERWAVE;
        else if (PADDLE_CURRENCIES.includes(cur))
            provider = payment_entity_1.PaymentProvider.PADDLE;
        else if (STRIPE_CURRENCIES.includes(cur))
            provider = payment_entity_1.PaymentProvider.STRIPE;
        else
            throw new common_1.BadRequestException(`Currency ${cur} is not supported`);
        const payment = await this.repo.save(this.repo.create({
            orderId, userId, reference,
            amount: order.total,
            currency: cur,
            provider,
            status: payment_entity_1.TxStatus.PENDING,
        }));
        if (provider === payment_entity_1.PaymentProvider.FLUTTERWAVE) {
            return this.initFlutterwave(payment, reference);
        }
        else if (provider === payment_entity_1.PaymentProvider.PADDLE) {
            return this.initPaddle(payment, email, order.total, cur, reference, customerName);
        }
        else {
            return this.initStripe(payment, email, order.total, cur, reference);
        }
    }
    async initFlutterwave(payment, reference) {
        return { provider: 'flutterwave', reference };
    }
    async verifyFlutterwave(transactionId, txRef) {
        const secretKey = this.cfg.get('flutterwave.secretKey');
        const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
            headers: { 'Authorization': `Bearer ${secretKey}` },
        });
        const data = await res.json();
        if (data.status !== 'success' || data.data.status !== 'successful') {
            throw new common_1.BadRequestException('Flutterwave payment verification failed');
        }
        return this.handleSuccessfulPayment(txRef, transactionId.toString(), payment_entity_1.PaymentProvider.FLUTTERWAVE, data.data);
    }
    async handleFlutterwaveWebhook(payload, signature) {
        const secretHash = this.cfg.get('flutterwave.webhookHash');
        if (signature !== secretHash) {
            this.logger.warn('Invalid Flutterwave webhook signature');
            return;
        }
        const event = JSON.parse(payload.toString());
        this.logger.log(`Flutterwave webhook: ${event.event}`);
        if (event.event === 'charge.completed' && event.data?.status === 'successful') {
            const { tx_ref, id } = event.data;
            const alreadyDone = await this.redis.get(`webhook:flw:${tx_ref}`);
            if (alreadyDone)
                return;
            await this.redis.set(`webhook:flw:${tx_ref}`, '1', 86400);
            if (event.data?.meta?.subscriptionInvoiceId) {
                await this.subscriptions.handleWebhookSuccess(event.data.meta.subscriptionInvoiceId, id.toString(), event.data)
                    .catch(e => this.logger.error('Flutterwave subscription webhook error:', e.message));
            }
            else {
                await this.handleSuccessfulPayment(tx_ref, id.toString(), payment_entity_1.PaymentProvider.FLUTTERWAVE, event.data)
                    .catch(e => this.logger.error('Flutterwave webhook error:', e.message));
            }
        }
    }
    async initPaddle(payment, email, amount, currency, reference, customerName) {
        const apiKey = this.cfg.get('paddle.apiKey');
        const environment = this.cfg.get('paddle.environment');
        const productId = this.cfg.get('paddle.productId');
        const baseUrl = environment === 'production'
            ? 'https://api.paddle.com'
            : 'https://sandbox-api.paddle.com';
        const amountCents = String((0, pagination_util_1.toSubunit)(amount, currency));
        const body = {
            items: [{
                    price: {
                        description: `Solar Maket Order`,
                        product_id: productId,
                        tax_mode: 'external',
                        unit_price: { amount: amountCents, currency_code: currency },
                        billing_cycle: null,
                        quantity: { minimum: 1, maximum: 1 },
                    },
                    quantity: 1,
                }],
            custom_data: { orderId: payment.orderId, reference, paymentId: payment.id },
            checkout: {
                url: `${process.env.FRONTEND_URL}/orders/${payment.orderId}`,
            },
        };
        if (email) {
            body.customer = { email };
        }
        const res = await fetch(`${baseUrl}/transactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.data?.checkout?.url) {
            throw new common_1.BadRequestException(data.error?.detail || 'Paddle init failed');
        }
        await this.repo.update(payment.id, { gatewayTransactionId: data.data.id });
        return { provider: 'paddle', reference, paymentUrl: data.data.checkout.url };
    }
    async handlePaddleWebhook(payload, signature) {
        const webhookSecret = this.cfg.get('paddle.webhookSecret');
        const parts = Object.fromEntries(signature.split(';').map(p => p.split('=')));
        const ts = parts.ts;
        const h1 = parts.h1;
        const expected = crypto
            .createHmac('sha256', webhookSecret)
            .update(`${ts}:${payload.toString()}`)
            .digest('hex');
        if (expected !== h1) {
            this.logger.warn('Invalid Paddle webhook signature');
            return;
        }
        const event = JSON.parse(payload.toString());
        this.logger.log(`Paddle webhook: ${event.event_type}`);
        if (event.event_type === 'transaction.completed') {
            const txData = event.data;
            const reference = txData.custom_data?.reference;
            if (!reference)
                return;
            const alreadyDone = await this.redis.get(`webhook:paddle:${reference}`);
            if (alreadyDone)
                return;
            await this.redis.set(`webhook:paddle:${reference}`, '1', 86400);
            if (txData.custom_data?.subscriptionInvoiceId) {
                await this.subscriptions.handleWebhookSuccess(txData.custom_data.subscriptionInvoiceId, txData.id, txData)
                    .catch(e => this.logger.error('Paddle subscription webhook error:', e.message));
            }
            else {
                await this.handleSuccessfulPayment(reference, txData.id, payment_entity_1.PaymentProvider.PADDLE, txData)
                    .catch(e => this.logger.error('Paddle webhook error:', e.message));
            }
        }
    }
    async initPaystack(payment, email, amount, currency, reference) {
        const secretKey = this.cfg.get('paystack.secretKey');
        const amountKobo = (0, pagination_util_1.toSubunit)(amount, currency);
        const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email, amount: amountKobo, currency,
                reference,
                callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
                metadata: { orderId: payment.orderId, paymentId: payment.id },
            }),
        });
        const data = await res.json();
        if (!data.status)
            throw new common_1.BadRequestException(data.message || 'Paystack init failed');
        await this.repo.update(payment.id, { gatewayTransactionId: data.data.access_code });
        return { provider: 'paystack', reference, paymentUrl: data.data.authorization_url };
    }
    async verifyPaystack(reference) {
        const secretKey = this.cfg.get('paystack.secretKey');
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { 'Authorization': `Bearer ${secretKey}` },
        });
        const data = await res.json();
        if (!data.status || data.data.status !== 'success') {
            throw new common_1.BadRequestException('Payment verification failed');
        }
        return this.handleSuccessfulPayment(reference, data.data.id.toString(), payment_entity_1.PaymentProvider.PAYSTACK, data.data);
    }
    async handlePaystackWebhook(payload, signature) {
        const webhookSecret = this.cfg.get('paystack.webhookSecret');
        const hash = crypto.createHmac('sha512', webhookSecret).update(payload).digest('hex');
        if (hash !== signature) {
            this.logger.warn('Invalid Paystack webhook signature');
            return;
        }
        const event = JSON.parse(payload.toString());
        this.logger.log(`Paystack webhook: ${event.event}`);
        if (event.event === 'charge.success') {
            const { reference, id, metadata } = event.data;
            const alreadyDone = await this.redis.get(`webhook:ps:${reference}`);
            if (alreadyDone)
                return;
            await this.redis.set(`webhook:ps:${reference}`, '1', 86400);
            if (metadata?.subscriptionInvoiceId) {
                await this.subscriptions.handleWebhookSuccess(metadata.subscriptionInvoiceId, id.toString(), event.data)
                    .catch(e => this.logger.error('Paystack subscription webhook error:', e.message));
            }
            else {
                await this.handleSuccessfulPayment(reference, id.toString(), payment_entity_1.PaymentProvider.PAYSTACK, event.data)
                    .catch(e => this.logger.error('Paystack webhook error:', e.message));
            }
        }
        if (event.event === 'refund.processed') {
            await this.handleRefundWebhook(event.data, payment_entity_1.PaymentProvider.PAYSTACK);
        }
    }
    async initStripe(payment, email, amount, currency, reference) {
        const amountCents = (0, pagination_util_1.toSubunit)(amount, currency);
        const intent = await this.stripe.paymentIntents.create({
            amount: amountCents,
            currency: currency.toLowerCase(),
            receipt_email: email,
            metadata: { reference, orderId: payment.orderId, paymentId: payment.id },
            automatic_payment_methods: { enabled: true },
        });
        await this.repo.update(payment.id, { gatewayTransactionId: intent.id });
        return { provider: 'stripe', reference, clientSecret: intent.client_secret };
    }
    async handleStripeWebhook(payload, signature) {
        const webhookSecret = this.cfg.get('stripe.webhookSecret');
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch {
            this.logger.warn('Invalid Stripe webhook signature');
            return;
        }
        this.logger.log(`Stripe webhook: ${event.type}`);
        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object;
            const ref = intent.metadata?.reference;
            if (!ref)
                return;
            const alreadyDone = await this.redis.get(`webhook:stripe:${ref}`);
            if (alreadyDone)
                return;
            await this.redis.set(`webhook:stripe:${ref}`, '1', 86400);
            if (intent.metadata?.subscriptionInvoiceId) {
                await this.subscriptions.handleWebhookSuccess(intent.metadata.subscriptionInvoiceId, intent.id, intent)
                    .catch(e => this.logger.error('Stripe subscription webhook error:', e.message));
            }
            else {
                await this.handleSuccessfulPayment(ref, intent.id, payment_entity_1.PaymentProvider.STRIPE, intent)
                    .catch(e => this.logger.error('Stripe webhook error:', e.message));
            }
        }
        if (event.type === 'charge.refunded') {
            await this.handleRefundWebhook(event.data.object, payment_entity_1.PaymentProvider.STRIPE);
        }
    }
    async handleSuccessfulPayment(reference, gatewayTxId, provider, metadata) {
        const payment = await this.repo.findOne({ where: { reference } });
        if (!payment)
            throw new common_1.NotFoundException(`Payment not found: ${reference}`);
        if (payment.status === payment_entity_1.TxStatus.SUCCESS)
            return payment;
        await this.repo.update(payment.id, {
            status: payment_entity_1.TxStatus.SUCCESS,
            gatewayTransactionId: gatewayTxId,
            paidAt: new Date(),
            metadata,
        });
        const order = await this.orders.markPaid(payment.orderId, reference, provider);
        this.logger.log(`Payment ${reference} (${provider}) successful for order ${order.orderNumber}`);
        return { ...payment, status: payment_entity_1.TxStatus.SUCCESS };
    }
    async refund(paymentId, amount, reason) {
        const payment = await this.repo.findOne({ where: { id: paymentId } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.status !== payment_entity_1.TxStatus.SUCCESS)
            throw new common_1.BadRequestException('Payment not completed');
        const refundAmount = amount || payment.amount;
        if (payment.provider === payment_entity_1.PaymentProvider.STRIPE && payment.gatewayTransactionId) {
            await this.stripe.refunds.create({
                payment_intent: payment.gatewayTransactionId,
                amount: (0, pagination_util_1.toSubunit)(refundAmount, payment.currency),
                reason: 'requested_by_customer',
            });
        }
        else if (payment.provider === payment_entity_1.PaymentProvider.PAYSTACK && payment.gatewayTransactionId) {
            const secretKey = this.cfg.get('paystack.secretKey');
            await fetch('https://api.paystack.co/refund', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction: payment.reference,
                    amount: (0, pagination_util_1.toSubunit)(refundAmount, payment.currency),
                }),
            });
        }
        await this.repo.update(paymentId, {
            status: payment_entity_1.TxStatus.REFUNDED,
            refundAmount, refundReason: reason, refundedAt: new Date(),
        });
        return this.repo.findOne({ where: { id: paymentId } });
    }
    async handleRefundWebhook(data, provider) {
        const reference = provider === payment_entity_1.PaymentProvider.PAYSTACK ? data.transaction?.reference : data.payment_intent;
        if (!reference)
            return;
        const payment = await this.repo.findOne({ where: { reference } });
        if (payment) {
            await this.repo.update(payment.id, { status: payment_entity_1.TxStatus.REFUNDED, refundedAt: new Date() });
            this.logger.log(`Refund webhook processed: ${reference}`);
        }
    }
    async getPaymentByOrder(orderId) {
        return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
    }
    async getStats() {
        const [total, success, failed] = await Promise.all([
            this.repo.count(),
            this.repo.count({ where: { status: payment_entity_1.TxStatus.SUCCESS } }),
            this.repo.count({ where: { status: payment_entity_1.TxStatus.FAILED } }),
        ]);
        const revenue = await this.repo
            .createQueryBuilder('p')
            .where('p.status = :s', { s: payment_entity_1.TxStatus.SUCCESS })
            .select('SUM(p.amount)', 'total')
            .addSelect('p.currency', 'currency')
            .groupBy('p.currency')
            .getRawMany();
        return { total, success, failed, revenue };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService,
        orders_service_1.OrdersService,
        notifications_service_1.NotificationsService,
        redis_service_1.RedisService,
        subscriptions_service_1.SubscriptionsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map