import {
  Injectable, BadRequestException, NotFoundException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import * as crypto from 'crypto';
import { SubscriptionInvoice, InvoiceStatus } from './subscription-invoice.entity';
import { User } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';
import { toSubunit } from '@common/utils/pagination.util';

export const SUBSCRIPTION_PLANS: Record<string, {
  name: string;
  listingLimit: number;
  priceNGN: number;
  priceUSD: number;
  billingCycleDays: number;
  features: string[];
  includesEngineer?: boolean;
}> = {
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

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(SubscriptionInvoice) private readonly invoiceRepo: Repository<SubscriptionInvoice>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly cfg: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.stripe = new Stripe(cfg.get('stripe.secretKey'), { apiVersion: '2025-02-24.acacia' });
  }

  getPlans() {
    return Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      key,
      ...plan,
      listingLimit: isFinite(plan.listingLimit) ? plan.listingLimit : null,
    }));
  }

  async subscribe(
    user: User,
    plan: string,
    currency: string,
  ): Promise<{ provider: string; reference: string; paymentUrl?: string; clientSecret?: string }> {
    if (plan === 'free') throw new BadRequestException('Cannot subscribe to the free plan');
    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig) throw new BadRequestException(`Unknown plan: ${plan}`);
    if (!user.isSeller && !user.isEngineer) {
      throw new ForbiddenException('Only sellers or engineers can subscribe to a paid plan');
    }

    const cur = currency.toUpperCase();
    const amount = cur === 'NGN' ? planConfig.priceNGN : planConfig.priceUSD;
    const reference = `SH-SUB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const invoice = await this.invoiceRepo.save(
      this.invoiceRepo.create({
        userId: user.id,
        plan,
        amount,
        currency: cur,
        reference,
        status: InvoiceStatus.PENDING,
      }),
    );

    if (['NGN', 'GHS'].includes(cur)) {
      return this.initPaystack(invoice, user.email, amount, cur, reference);
    } else {
      return this.initStripe(invoice, user.email, amount, cur, reference);
    }
  }

  private async initPaystack(invoice: SubscriptionInvoice, email: string, amount: number, currency: string, reference: string) {
    const secretKey = this.cfg.get('paystack.secretKey');
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: toSubunit(amount, currency),
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
    const data = await res.json() as any;
    if (!data.status) throw new BadRequestException(data.message || 'Paystack init failed');
    await this.invoiceRepo.update(invoice.id, { gatewayTransactionId: data.data.access_code });
    return { provider: 'paystack', reference, paymentUrl: data.data.authorization_url };
  }

  private async initStripe(invoice: SubscriptionInvoice, email: string, amount: number, currency: string, reference: string) {
    const amountCents = toSubunit(amount, currency);
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

  /** Called by PaymentsService when a subscription payment succeeds via webhook */
  async handleWebhookSuccess(invoiceId: string, gatewayTxId: string, gatewayData: any): Promise<void> {
    const idempotencyKey = `webhook:sub:${invoiceId}`;
    const alreadyDone = await this.redis.get(idempotencyKey);
    if (alreadyDone) return;
    await this.redis.set(idempotencyKey, '1', 86400);

    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice || invoice.status === InvoiceStatus.PAID) return;

    const now = new Date();
    const plan = SUBSCRIPTION_PLANS[invoice.plan];
    const periodEnd = new Date(now.getTime() + (plan?.billingCycleDays ?? 30) * 24 * 60 * 60 * 1000);

    await this.invoiceRepo.update(invoice.id, {
      status: InvoiceStatus.PAID,
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

  async cancelSubscription(userId: string): Promise<{ message: string }> {
    await this.userRepo.update(userId, { subscriptionStatus: 'canceled' });
    return { message: 'Subscription cancelled. Your plan remains active until the end of the billing period.' };
  }

  async getInvoices(userId: string, page = 1, limit = 10) {
    const [data, total] = await this.invoiceRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getInvoiceById(id: string, userId: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.userId !== userId) throw new ForbiddenException('Not your invoice');
    return invoice;
  }

  /** Called by verifyPaystack fallback (manual verify flow) */
  async verifyPaystackReference(reference: string): Promise<SubscriptionInvoice> {
    const secretKey = this.cfg.get('paystack.secretKey');
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await res.json() as any;
    if (!data.status || data.data.status !== 'success') {
      throw new BadRequestException('Payment not confirmed');
    }
    const invoiceId = data.data.metadata?.subscriptionInvoiceId;
    if (!invoiceId) throw new BadRequestException('Not a subscription payment');
    await this.handleWebhookSuccess(invoiceId, data.data.id.toString(), data.data);
    return this.invoiceRepo.findOne({ where: { id: invoiceId } });
  }
}
