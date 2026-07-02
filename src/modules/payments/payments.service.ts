import {
  Injectable, BadRequestException, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import * as crypto from 'crypto';
import { Payment, PaymentProvider, TxStatus, PaymentMethod } from './payment.entity';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { toSubunit } from '@common/utils/pagination.util';

// Currency routing
const FLW_CURRENCIES     = ['NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'XOF', 'RWF'];
const PADDLE_CURRENCIES  = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const STRIPE_CURRENCIES  = ['CNY'];                   // Paddle doesn't support CNY
const PAYSTACK_CURRENCIES = ['NGN', 'USD', 'GHS'];    // kept for direct verify/webhook only

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    private readonly cfg: ConfigService,
    private readonly orders: OrdersService,
    private readonly notif: NotificationsService,
    private readonly redis: RedisService,
    private readonly subscriptions: SubscriptionsService,
  ) {
    this.stripe = new Stripe(cfg.get('stripe.secretKey'), { apiVersion: '2025-02-24.acacia' });
  }

  // ── Initiate payment ──────────────────────────────────────────────────────
  async initiatePayment(
    orderId: string,
    userId: string,
    currency: string,
    email: string,
    method?: string,
    customerName?: string,
  ): Promise<{ provider: string; reference: string; paymentUrl?: string; clientSecret?: string }> {
    const order = await this.orders.findById(orderId, userId, 'buyer');
    if (order.paymentStatus === 'paid') throw new BadRequestException('Order already paid');

    const reference = `SH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const cur = currency.toUpperCase();

    let provider: PaymentProvider;
    if (FLW_CURRENCIES.includes(cur))     provider = PaymentProvider.FLUTTERWAVE;
    else if (PADDLE_CURRENCIES.includes(cur)) provider = PaymentProvider.PADDLE;
    else if (STRIPE_CURRENCIES.includes(cur)) provider = PaymentProvider.STRIPE;
    else throw new BadRequestException(`Currency ${cur} is not supported`);

    const payment = await this.repo.save(
      this.repo.create({
        orderId, userId, reference,
        amount: order.total,
        currency: cur,
        provider,
        status: TxStatus.PENDING,
      }),
    );

    if (provider === PaymentProvider.FLUTTERWAVE) {
      return this.initFlutterwave(payment, reference);
    } else if (provider === PaymentProvider.PADDLE) {
      return this.initPaddle(payment, email, order.total, cur, reference, customerName);
    } else {
      return this.initStripe(payment, email, order.total, cur, reference);
    }
  }

  // ── Flutterwave ───────────────────────────────────────────────────────────
  private async initFlutterwave(
    payment: Payment, reference: string,
  ): Promise<{ provider: string; reference: string }> {
    // Inline SDK handles checkout on the frontend — backend just provides reference
    return { provider: 'flutterwave', reference };
  }

  async verifyFlutterwave(transactionId: string, txRef: string): Promise<Payment> {
    const secretKey = this.cfg.get('flutterwave.secretKey');
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });
    const data = await res.json() as any;
    if (data.status !== 'success' || data.data.status !== 'successful') {
      throw new BadRequestException('Flutterwave payment verification failed');
    }
    return this.handleSuccessfulPayment(txRef, transactionId.toString(), PaymentProvider.FLUTTERWAVE, data.data);
  }

  async handleFlutterwaveWebhook(payload: Buffer, signature: string): Promise<void> {
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
      if (alreadyDone) return;
      await this.redis.set(`webhook:flw:${tx_ref}`, '1', 86400);

      if (event.data?.meta?.subscriptionInvoiceId) {
        await this.subscriptions.handleWebhookSuccess(event.data.meta.subscriptionInvoiceId, id.toString(), event.data)
          .catch(e => this.logger.error('Flutterwave subscription webhook error:', e.message));
      } else {
        await this.handleSuccessfulPayment(tx_ref, id.toString(), PaymentProvider.FLUTTERWAVE, event.data)
          .catch(e => this.logger.error('Flutterwave webhook error:', e.message));
      }
    }
  }

  // ── Paddle ────────────────────────────────────────────────────────────────
  private async initPaddle(
    payment: Payment, email: string, amount: number, currency: string,
    reference: string, customerName?: string,
  ): Promise<{ provider: string; reference: string; paymentUrl: string }> {
    const apiKey = this.cfg.get('paddle.apiKey');
    const environment = this.cfg.get('paddle.environment');
    const productId = this.cfg.get('paddle.productId');
    const baseUrl = environment === 'production'
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com';

    const amountCents = String(toSubunit(amount, currency));

    const body: any = {
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

    const data = await res.json() as any;
    if (!data.data?.checkout?.url) {
      throw new BadRequestException(data.error?.detail || 'Paddle init failed');
    }

    await this.repo.update(payment.id, { gatewayTransactionId: data.data.id });
    return { provider: 'paddle', reference, paymentUrl: data.data.checkout.url };
  }

  async handlePaddleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.cfg.get('paddle.webhookSecret');

    // Parse: ts=xxx;h1=xxx
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
      if (!reference) return;

      const alreadyDone = await this.redis.get(`webhook:paddle:${reference}`);
      if (alreadyDone) return;
      await this.redis.set(`webhook:paddle:${reference}`, '1', 86400);

      if (txData.custom_data?.subscriptionInvoiceId) {
        await this.subscriptions.handleWebhookSuccess(txData.custom_data.subscriptionInvoiceId, txData.id, txData)
          .catch(e => this.logger.error('Paddle subscription webhook error:', e.message));
      } else {
        await this.handleSuccessfulPayment(reference, txData.id, PaymentProvider.PADDLE, txData)
          .catch(e => this.logger.error('Paddle webhook error:', e.message));
      }
    }
  }

  // ── Paystack (legacy — kept for existing payments) ────────────────────────
  private async initPaystack(
    payment: Payment, email: string, amount: number, currency: string, reference: string,
  ) {
    const secretKey = this.cfg.get('paystack.secretKey');
    const amountKobo = toSubunit(amount, currency);

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

    const data = await res.json() as any;
    if (!data.status) throw new BadRequestException(data.message || 'Paystack init failed');

    await this.repo.update(payment.id, { gatewayTransactionId: data.data.access_code });
    return { provider: 'paystack', reference, paymentUrl: data.data.authorization_url };
  }

  async verifyPaystack(reference: string): Promise<Payment> {
    const secretKey = this.cfg.get('paystack.secretKey');
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });
    const data = await res.json() as any;
    if (!data.status || data.data.status !== 'success') {
      throw new BadRequestException('Payment verification failed');
    }
    return this.handleSuccessfulPayment(reference, data.data.id.toString(), PaymentProvider.PAYSTACK, data.data);
  }

  async handlePaystackWebhook(payload: Buffer, signature: string): Promise<void> {
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
      if (alreadyDone) return;
      await this.redis.set(`webhook:ps:${reference}`, '1', 86400);

      if (metadata?.subscriptionInvoiceId) {
        await this.subscriptions.handleWebhookSuccess(metadata.subscriptionInvoiceId, id.toString(), event.data)
          .catch(e => this.logger.error('Paystack subscription webhook error:', e.message));
      } else {
        await this.handleSuccessfulPayment(reference, id.toString(), PaymentProvider.PAYSTACK, event.data)
          .catch(e => this.logger.error('Paystack webhook error:', e.message));
      }
    }

    if (event.event === 'refund.processed') {
      await this.handleRefundWebhook(event.data, PaymentProvider.PAYSTACK);
    }
  }

  // ── Stripe ────────────────────────────────────────────────────────────────
  private async initStripe(
    payment: Payment, email: string, amount: number, currency: string, reference: string,
  ) {
    const amountCents = toSubunit(amount, currency);
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

  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.cfg.get('stripe.webhookSecret');
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      this.logger.warn('Invalid Stripe webhook signature');
      return;
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const ref = intent.metadata?.reference;
      if (!ref) return;
      const alreadyDone = await this.redis.get(`webhook:stripe:${ref}`);
      if (alreadyDone) return;
      await this.redis.set(`webhook:stripe:${ref}`, '1', 86400);

      if (intent.metadata?.subscriptionInvoiceId) {
        await this.subscriptions.handleWebhookSuccess(intent.metadata.subscriptionInvoiceId, intent.id, intent)
          .catch(e => this.logger.error('Stripe subscription webhook error:', e.message));
      } else {
        await this.handleSuccessfulPayment(ref, intent.id, PaymentProvider.STRIPE, intent)
          .catch(e => this.logger.error('Stripe webhook error:', e.message));
      }
    }

    if (event.type === 'charge.refunded') {
      await this.handleRefundWebhook(event.data.object, PaymentProvider.STRIPE);
    }
  }

  // ── Shared success handler ────────────────────────────────────────────────
  private async handleSuccessfulPayment(
    reference: string,
    gatewayTxId: string,
    provider: PaymentProvider,
    metadata?: any,
  ): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { reference } });
    if (!payment) throw new NotFoundException(`Payment not found: ${reference}`);
    if (payment.status === TxStatus.SUCCESS) return payment;

    await this.repo.update(payment.id, {
      status: TxStatus.SUCCESS,
      gatewayTransactionId: gatewayTxId,
      paidAt: new Date(),
      metadata,
    });

    const order = await this.orders.markPaid(payment.orderId, reference, provider);
    this.logger.log(`Payment ${reference} (${provider}) successful for order ${order.orderNumber}`);

    return { ...payment, status: TxStatus.SUCCESS };
  }

  // ── Refund ────────────────────────────────────────────────────────────────
  async refund(paymentId: string, amount?: number, reason?: string): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== TxStatus.SUCCESS) throw new BadRequestException('Payment not completed');

    const refundAmount = amount || payment.amount;

    if (payment.provider === PaymentProvider.STRIPE && payment.gatewayTransactionId) {
      await this.stripe.refunds.create({
        payment_intent: payment.gatewayTransactionId,
        amount: toSubunit(refundAmount, payment.currency),
        reason: 'requested_by_customer',
      });
    } else if (payment.provider === PaymentProvider.PAYSTACK && payment.gatewayTransactionId) {
      const secretKey = this.cfg.get('paystack.secretKey');
      await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: payment.reference,
          amount: toSubunit(refundAmount, payment.currency),
        }),
      });
    }
    // Flutterwave and Paddle refunds can be added later

    await this.repo.update(paymentId, {
      status: TxStatus.REFUNDED,
      refundAmount, refundReason: reason, refundedAt: new Date(),
    });
    return this.repo.findOne({ where: { id: paymentId } });
  }

  private async handleRefundWebhook(data: any, provider: PaymentProvider): Promise<void> {
    const reference = provider === PaymentProvider.PAYSTACK ? data.transaction?.reference : data.payment_intent;
    if (!reference) return;
    const payment = await this.repo.findOne({ where: { reference } });
    if (payment) {
      await this.repo.update(payment.id, { status: TxStatus.REFUNDED, refundedAt: new Date() });
      this.logger.log(`Refund webhook processed: ${reference}`);
    }
  }

  async getPaymentByOrder(orderId: string): Promise<Payment[]> {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  async getStats() {
    const [total, success, failed] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: TxStatus.SUCCESS } }),
      this.repo.count({ where: { status: TxStatus.FAILED } }),
    ]);
    const revenue = await this.repo
      .createQueryBuilder('p')
      .where('p.status = :s', { s: TxStatus.SUCCESS })
      .select('SUM(p.amount)', 'total')
      .addSelect('p.currency', 'currency')
      .groupBy('p.currency')
      .getRawMany();
    return { total, success, failed, revenue };
  }
}
