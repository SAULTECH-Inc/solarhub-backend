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
import { toSubunit } from '@common/utils/pagination.util';

// Paystack supports NGN, USD, GHS natively
// Stripe supports USD, CNY (and more) globally
const PAYSTACK_CURRENCIES = ['NGN', 'USD', 'GHS'];
const STRIPE_CURRENCIES = ['USD', 'CNY', 'GBP', 'EUR'];

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
  ) {
    this.stripe = new Stripe(cfg.get('stripe.secretKey'), { apiVersion: '2025-02-24.acacia' });
  }

  // ── Initiate payment ──────────────────────────────────────
  async initiatePayment(
    orderId: string,
    userId: string,
    currency: string,
    email: string,
    method?: string,
  ): Promise<{ provider: string; reference: string; paymentUrl?: string; clientSecret?: string }> {
    const order = await this.orders.findById(orderId, userId, 'buyer');
    if (order.paymentStatus === 'paid') throw new BadRequestException('Order already paid');

    const reference = `SH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const cur = currency.toUpperCase();

    // Create payment record
    const payment = await this.repo.save(
      this.repo.create({
        orderId, userId, reference,
        amount: order.total,
        currency: cur,
        provider: PAYSTACK_CURRENCIES.includes(cur) ? PaymentProvider.PAYSTACK : PaymentProvider.STRIPE,
        status: TxStatus.PENDING,
      }),
    );

    if (PAYSTACK_CURRENCIES.includes(cur)) {
      return this.initPaystack(payment, email, order.total, cur, reference);
    } else if (STRIPE_CURRENCIES.includes(cur)) {
      return this.initStripe(payment, email, order.total, cur, reference);
    } else {
      throw new BadRequestException(`Currency ${cur} not supported`);
    }
  }

  // ── Paystack ──────────────────────────────────────────────
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

  // ── Paystack webhook ──────────────────────────────────────
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
      const { reference, id } = event.data;
      // Idempotency check
      const alreadyDone = await this.redis.get(`webhook:ps:${reference}`);
      if (alreadyDone) return;
      await this.redis.set(`webhook:ps:${reference}`, '1', 86400);
      await this.handleSuccessfulPayment(reference, id.toString(), PaymentProvider.PAYSTACK, event.data).catch(e =>
        this.logger.error('Error processing Paystack webhook:', e.message),
      );
    }

    if (event.event === 'refund.processed') {
      await this.handleRefundWebhook(event.data, PaymentProvider.PAYSTACK);
    }
  }

  // ── Stripe ────────────────────────────────────────────────
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
      await this.handleSuccessfulPayment(ref, intent.id, PaymentProvider.STRIPE, intent).catch(e =>
        this.logger.error('Error processing Stripe webhook:', e.message),
      );
    }

    if (event.type === 'charge.refunded') {
      await this.handleRefundWebhook(event.data.object, PaymentProvider.STRIPE);
    }
  }

  // ── Shared success handler ────────────────────────────────
  private async handleSuccessfulPayment(
    reference: string,
    gatewayTxId: string,
    provider: PaymentProvider,
    metadata?: any,
  ): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { reference } });
    if (!payment) throw new NotFoundException(`Payment not found: ${reference}`);
    if (payment.status === TxStatus.SUCCESS) return payment; // idempotent

    await this.repo.update(payment.id, {
      status: TxStatus.SUCCESS,
      gatewayTransactionId: gatewayTxId,
      paidAt: new Date(),
      metadata,
    });

    // Update order
    const order = await this.orders.markPaid(payment.orderId, reference, provider);

    // Notify
    const notifPayload = {
      id: payment.id,
      amount: payment.amount,
      orderNumber: order.orderNumber,
      reference,
    };
    // We'd fetch user here in production — simplified for now
    this.logger.log(`Payment ${reference} successful for order ${order.orderNumber}`);

    return { ...payment, status: TxStatus.SUCCESS };
  }

  // ── Refund ────────────────────────────────────────────────
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
