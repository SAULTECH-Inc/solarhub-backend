import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification, NotificationType } from './notification.entity';
import { User } from '../users/user.entity';
import { paginate, paginationToSkipTake } from '../../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  // ── Email dispatch (queued) ────────────────────────────────
  private async sendEmail(job: string, data: any, opts?: any) {
    await this.emailQueue.add(job, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      ...opts,
    });
  }

  async sendEmailVerification(user: User, otp: string) {
    await this.sendEmail('email-verification', {
      to:        user.email,
      firstName: user.firstName,
      otp,
    });
  }

  async sendWelcomeEmail(user: User) {
    await this.sendEmail('welcome', {
      to: user.email, firstName: user.firstName,
    }, { delay: 5000 });
  }

  async sendPasswordReset(user: User, token: string) {
    await this.sendEmail('password-reset', {
      to: user.email, firstName: user.firstName, token,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
    });
  }

  async sendPasswordChanged(user: User) {
    await this.sendEmail('password-changed', {
      to: user.email, firstName: user.firstName,
    });
  }

  async sendOrderConfirmation(user: User, order: any) {
    await this.sendEmail('order-confirmation', {
      to: user.email, firstName: user.firstName, order,
    });
    await this.createInApp(user.id, NotificationType.ORDER_PLACED, {
      title: `Order ${order.orderNumber} Placed`,
      body: `Your order for ${order.itemCount} item(s) totalling ₦${order.total.toLocaleString()} has been placed.`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  async sendOrderStatusUpdate(user: User, order: any, status: string) {
    await this.sendEmail('order-status', {
      to: user.email, firstName: user.firstName, order, status,
    });
    const typeMap: Record<string, NotificationType> = {
      confirmed:    NotificationType.ORDER_CONFIRMED,
      dispatched:   NotificationType.ORDER_SHIPPED,
      in_transit:   NotificationType.ORDER_SHIPPED,
      out_delivery: NotificationType.ORDER_SHIPPED,
      delivered:    NotificationType.ORDER_DELIVERED,
    };
    await this.createInApp(user.id, typeMap[status] || NotificationType.SYSTEM, {
      title: `Order ${order.orderNumber} — ${status.replace(/_/g,' ')}`,
      body: `Your order status has been updated to: ${status.replace(/_/g,' ')}`,
      data: { orderId: order.id },
    });
  }

  async sendPaymentReceipt(user: User, payment: any) {
    await this.sendEmail('payment-receipt', {
      to: user.email, firstName: user.firstName, payment,
    });
    await this.createInApp(user.id, NotificationType.PAYMENT_SUCCESS, {
      title: 'Payment Successful',
      body: `Payment of ₦${payment.amount.toLocaleString()} confirmed for Order ${payment.orderNumber}.`,
      data: { paymentId: payment.id },
    });
  }

  async sendPaymentFailed(user: User, payment: any) {
    await this.sendEmail('payment-failed', {
      to: user.email, firstName: user.firstName, payment,
    });
    await this.createInApp(user.id, NotificationType.PAYMENT_FAILED, {
      title: 'Payment Failed',
      body: `Payment for Order ${payment.orderNumber} failed. Please retry.`,
      data: { paymentId: payment.id },
    });
  }

  async sendProductApproved(user: User, product: any) {
    await this.sendEmail('product-approved', {
      to: user.email, firstName: user.firstName, product,
    });
    await this.createInApp(user.id, NotificationType.PRODUCT_APPROVED, {
      title: 'Product Approved',
      body: `Your product "${product.name}" is now live on SolarHub!`,
      data: { productId: product.id },
    });
  }

  async sendNewChatMessage(user: User, fromName: string, preview: string) {
    await this.createInApp(user.id, NotificationType.NEW_MESSAGE, {
      title: `New message from ${fromName}`,
      body: preview.slice(0, 120),
      data: {},
    });
  }

  // ── In-app notifications ──────────────────────────────────
  async createInApp(
    userId: string,
    type: NotificationType,
    payload: { title: string; body: string; data?: any },
  ): Promise<Notification> {
    const notif = this.repo.create({ userId, type, ...payload });
    return this.repo.save(notif);
  }

  async getUserNotifications(userId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip, take,
    });
    const unread = await this.repo.count({ where: { userId, read: false } });
    return { ...paginate(data, total, page, limit), unread };
  }

  async markRead(userId: string, ids: string[]): Promise<void> {
    await this.repo.update(
      ids.length ? ids.map(id => ({ id, userId })) as any : { userId },
      { read: true, readAt: new Date() },
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.update({ userId, read: false }, { read: true, readAt: new Date() });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, read: false } });
  }
}
