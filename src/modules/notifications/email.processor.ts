import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailer: MailerService) {}

  @Process('email-verification')
  async handleEmailVerification(job: Job<{ to: string; firstName: string; otp: string }>) {
    const { to, firstName, otp } = job.data;
    await this.mailer.sendMail({
      to, subject: `${otp} — Verify your SolarHub email`,
      template: 'email-verification',
      context: { firstName, otp, year: new Date().getFullYear() },
    });
    this.logger.log(`Verification email sent to ${to}`);
  }

  @Process('welcome')
  async handleWelcome(job: Job<{ to: string; firstName: string }>) {
    const { to, firstName } = job.data;
    await this.mailer.sendMail({
      to, subject: '🌞 Welcome to SolarHub Nigeria!',
      template: 'welcome',
      context: { firstName, year: new Date().getFullYear() },
    });
  }

  @Process('password-reset')
  async handlePasswordReset(job: Job<{ to: string; firstName: string; resetUrl: string }>) {
    const { to, firstName, resetUrl } = job.data;
    await this.mailer.sendMail({
      to, subject: 'Reset your SolarHub password',
      template: 'password-reset',
      context: { firstName, resetUrl, year: new Date().getFullYear() },
    });
  }

  @Process('password-changed')
  async handlePasswordChanged(job: Job<{ to: string; firstName: string }>) {
    const { to, firstName } = job.data;
    await this.mailer.sendMail({
      to, subject: 'Your SolarHub password has been changed',
      template: 'password-changed',
      context: { firstName, year: new Date().getFullYear() },
    });
  }

  @Process('order-confirmation')
  async handleOrderConfirmation(job: Job<{ to: string; firstName: string; order: any }>) {
    const { to, firstName, order } = job.data;
    await this.mailer.sendMail({
      to, subject: `Order ${order.orderNumber} Confirmed — SolarHub`,
      template: 'order-confirmation',
      context: { firstName, order, year: new Date().getFullYear() },
    });
  }

  @Process('order-status')
  async handleOrderStatus(job: Job<{ to: string; firstName: string; order: any; status: string }>) {
    const { to, firstName, order, status } = job.data;
    const subjects: Record<string, string> = {
      confirmed:    `Order ${order.orderNumber} — Payment Confirmed`,
      dispatched:   `Order ${order.orderNumber} — Dispatched from Seller`,
      in_transit:   `Order ${order.orderNumber} — In Transit`,
      out_delivery: `Order ${order.orderNumber} — Out for Delivery`,
      delivered:    `Order ${order.orderNumber} — Delivered! 🎉`,
    };
    await this.mailer.sendMail({
      to, subject: subjects[status] || `Order ${order.orderNumber} Update`,
      template: 'order-status',
      context: { firstName, order, status, year: new Date().getFullYear() },
    });
  }

  @Process('payment-receipt')
  async handlePaymentReceipt(job: Job<{ to: string; firstName: string; payment: any }>) {
    const { to, firstName, payment } = job.data;
    await this.mailer.sendMail({
      to, subject: `Payment Receipt — ₦${payment.amount.toLocaleString()}`,
      template: 'payment-receipt',
      context: { firstName, payment, year: new Date().getFullYear() },
    });
  }

  @Process('payment-failed')
  async handlePaymentFailed(job: Job<{ to: string; firstName: string; payment: any }>) {
    const { to, firstName, payment } = job.data;
    await this.mailer.sendMail({
      to, subject: `Payment Failed — Order ${payment.orderNumber}`,
      template: 'payment-failed',
      context: { firstName, payment, year: new Date().getFullYear() },
    });
  }

  @Process('product-approved')
  async handleProductApproved(job: Job<{ to: string; firstName: string; product: any }>) {
    const { to, firstName, product } = job.data;
    await this.mailer.sendMail({
      to, subject: `Your product "${product.name}" is live on SolarHub! ☀️`,
      template: 'product-approved',
      context: { firstName, product, year: new Date().getFullYear() },
    });
  }
}
