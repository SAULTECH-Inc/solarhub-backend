import {
  Injectable, Logger, BadRequestException,
  NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EscrowTransaction, EscrowStatus, EscrowCompletionReason } from './escrow.entity';
import { SellerBankAccount } from './seller-bank-account.entity';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DisputeCategory, DisputeType } from '../disputes/dispute.entity';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    @InjectRepository(EscrowTransaction)
    private readonly escrowRepo: Repository<EscrowTransaction>,
    @InjectRepository(SellerBankAccount)
    private readonly bankRepo: Repository<SellerBankAccount>,
    private readonly settings: PlatformSettingsService,
    private readonly notif: NotificationsService,
    private readonly cfg: ConfigService,
  ) {}

  // ── Bank Account ──────────────────────────────────────────────────────────

  async registerBankAccount(sellerId: string, bankCode: string, accountNumber: string): Promise<SellerBankAccount> {
    const secretKey = this.cfg.get<string>('paystack.secretKey');

    // Verify account name via Paystack
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const data = await res.json() as any;
    if (!data.status) {
      throw new BadRequestException(data.message || 'Could not verify bank account');
    }

    const accountName: string = data.data.account_name;

    // Get bank name
    const banksRes = await fetch('https://api.paystack.co/bank', {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const banksData = await banksRes.json() as any;
    const bank = (banksData.data || []).find((b: any) => b.code === bankCode);
    const bankName = bank?.name || bankCode;

    // Create Paystack transfer recipient
    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });
    const recipientData = await recipientRes.json() as any;
    if (!recipientData.status) {
      throw new BadRequestException(recipientData.message || 'Could not create transfer recipient');
    }

    const recipientCode: string = recipientData.data.recipient_code;

    // If first account, make it default
    const existing = await this.bankRepo.count({ where: { sellerId } });
    if (existing > 0) {
      // Unset previous defaults
      await this.bankRepo.update({ sellerId, isDefault: true }, { isDefault: false });
    }

    return this.bankRepo.save(this.bankRepo.create({
      sellerId, bankCode, bankName, accountNumber,
      accountName, recipientCode,
      isVerified: true,
      isDefault: true,
    }));
  }

  async getBankAccounts(sellerId: string): Promise<SellerBankAccount[]> {
    return this.bankRepo.find({ where: { sellerId }, order: { createdAt: 'DESC' } });
  }

  async deleteBankAccount(id: string, sellerId: string): Promise<void> {
    const account = await this.bankRepo.findOne({ where: { id, sellerId } });
    if (!account) throw new NotFoundException('Bank account not found');
    await this.bankRepo.remove(account);
  }

  // ── Initiate Escrow ───────────────────────────────────────────────────────

  async initiate(orderId: string, buyerId: string, sellerId: string, amount: number, currency: string): Promise<EscrowTransaction> {
    const existing = await this.escrowRepo.findOne({ where: { orderId } });
    if (existing) {
      if (existing.status === EscrowStatus.CANCELLED) {
        // Allow re-initiation on a cancelled escrow by removing old one
        await this.escrowRepo.remove(existing);
      } else {
        throw new BadRequestException('Escrow already exists for this order');
      }
    }

    const feePercent = await this.settings.getNumber('escrow_fee_percent');
    const feeAmount  = parseFloat(((amount * feePercent) / 100).toFixed(2));
    const sellerAmount = parseFloat((amount - feeAmount).toFixed(2));

    const reference = `ESC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const escrow = await this.escrowRepo.save(this.escrowRepo.create({
      reference, orderId, buyerId, sellerId,
      amount, feePercent, feeAmount, sellerAmount, currency,
      status: EscrowStatus.PENDING_AGREEMENT,
    }));

    this.logger.log(`Escrow initiated: ${escrow.reference} — order ${orderId}`);
    return escrow;
  }

  // ── Seller Responds ───────────────────────────────────────────────────────

  async sellerRespond(escrowId: string, sellerId: string, decision: 'accept' | 'decline', reason?: string): Promise<EscrowTransaction> {
    const escrow = await this.findAndAssertStatus(escrowId, EscrowStatus.PENDING_AGREEMENT);
    if (escrow.sellerId !== sellerId) throw new ForbiddenException('Not your escrow');

    if (decision === 'accept') {
      escrow.status = EscrowStatus.AWAITING_PAYMENT;
      escrow.sellerAgreedAt = new Date();
    } else {
      escrow.status = EscrowStatus.CANCELLED;
      escrow.sellerDeclinedAt = new Date();
      escrow.cancelledAt = new Date();
      escrow.cancelReason = reason || 'Seller declined escrow';
    }

    return this.escrowRepo.save(escrow);
  }

  // ── Fund Escrow (buyer pays) ──────────────────────────────────────────────

  async initiateFunding(escrowId: string, buyerId: string, email: string, currency: string): Promise<{ provider: string; reference: string; paymentUrl: string }> {
    const escrow = await this.findAndAssertStatus(escrowId, EscrowStatus.AWAITING_PAYMENT);
    if (escrow.buyerId !== buyerId) throw new ForbiddenException('Not your escrow');

    const secretKey = this.cfg.get<string>('paystack.secretKey');
    const amountKobo = Math.round(escrow.amount * 100);

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: currency.toUpperCase(),
        reference: escrow.reference,
        callback_url: `${process.env.FRONTEND_URL}/escrow/${escrow.id}/callback`,
        metadata: { escrowId: escrow.id, type: 'escrow' },
      }),
    });

    const data = await res.json() as any;
    if (!data.status) throw new BadRequestException(data.message || 'Paystack init failed');

    return { provider: 'paystack', reference: escrow.reference, paymentUrl: data.data.authorization_url };
  }

  async confirmFunding(reference: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepo.findOne({ where: { reference } });
    if (!escrow) throw new NotFoundException(`Escrow not found for reference: ${reference}`);
    if (escrow.status !== EscrowStatus.AWAITING_PAYMENT) return escrow; // idempotent

    const secretKey = this.cfg.get<string>('paystack.secretKey');
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await res.json() as any;
    if (!data.status || data.data.status !== 'success') {
      throw new BadRequestException('Payment verification failed');
    }

    escrow.status = EscrowStatus.FUNDED;
    escrow.paymentReference = reference;
    escrow.paymentProvider = 'paystack';
    escrow.fundedAt = new Date();
    return this.escrowRepo.save(escrow);
  }

  // ── Seller Marks Shipped ──────────────────────────────────────────────────

  async markShipped(
    escrowId: string,
    sellerId: string,
    trackingInfo: { carrier?: string; trackingNumber?: string; trackingUrl?: string; note?: string },
  ): Promise<EscrowTransaction> {
    const escrow = await this.findAndAssertStatus(escrowId, EscrowStatus.FUNDED);
    if (escrow.sellerId !== sellerId) throw new ForbiddenException('Not your escrow');

    const autoReleaseDays = await this.settings.getNumber('escrow_auto_release_days');
    const autoReleaseAt = new Date(Date.now() + autoReleaseDays * 86400000);

    escrow.status = EscrowStatus.SHIPPED;
    escrow.trackingInfo = trackingInfo;
    escrow.shippedAt = new Date();
    escrow.autoReleaseAt = autoReleaseAt;
    return this.escrowRepo.save(escrow);
  }

  // ── Buyer Confirms Delivery ───────────────────────────────────────────────

  async confirmDelivery(escrowId: string, buyerId: string): Promise<EscrowTransaction> {
    const escrow = await this.findAndAssertStatus(escrowId, EscrowStatus.SHIPPED);
    if (escrow.buyerId !== buyerId) throw new ForbiddenException('Not your escrow');

    escrow.confirmedAt = new Date();
    escrow.completionReason = EscrowCompletionReason.BUYER_CONFIRMED;
    return this.releaseFunds(escrow);
  }

  // ── Raise Dispute ─────────────────────────────────────────────────────────

  async raiseDispute(escrowId: string, buyerId: string, reason: string, evidence?: string[]): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepo.findOne({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.buyerId !== buyerId) throw new ForbiddenException('Not your escrow');

    const allowedStatuses = [EscrowStatus.FUNDED, EscrowStatus.SHIPPED];
    if (!allowedStatuses.includes(escrow.status)) {
      throw new BadRequestException(`Cannot raise dispute on an escrow with status: ${escrow.status}`);
    }

    escrow.status = EscrowStatus.DISPUTED;
    escrow.disputedAt = new Date();
    this.logger.log(`Escrow ${escrow.reference} disputed by buyer. Reason: ${reason}`);
    return this.escrowRepo.save(escrow);
  }

  // ── Admin: Resolve Dispute ────────────────────────────────────────────────

  async resolveDispute(escrowId: string, decision: 'release' | 'refund', note: string): Promise<EscrowTransaction> {
    const escrow = await this.findAndAssertStatus(escrowId, EscrowStatus.DISPUTED);
    escrow.adminNote = note;
    escrow.completionReason = EscrowCompletionReason.ADMIN_DECISION;

    if (decision === 'release') {
      return this.releaseFunds(escrow);
    } else {
      return this.refundBuyer(escrow);
    }
  }

  // ── Admin: Cancel (before funding) ───────────────────────────────────────

  async adminCancel(escrowId: string, reason: string): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepo.findOne({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if ([EscrowStatus.COMPLETED, EscrowStatus.REFUNDED].includes(escrow.status)) {
      throw new BadRequestException('Cannot cancel a completed or already-refunded escrow');
    }

    escrow.status = EscrowStatus.CANCELLED;
    escrow.cancelReason = reason;
    escrow.cancelledAt = new Date();
    return this.escrowRepo.save(escrow);
  }

  // ── Auto-release (called by cron) ─────────────────────────────────────────

  async processAutoReleases(): Promise<{ released: number; errors: number }> {
    const overdue = await this.escrowRepo.find({
      where: { status: EscrowStatus.SHIPPED, autoReleaseAt: LessThan(new Date()) },
    });

    let released = 0;
    let errors = 0;

    for (const escrow of overdue) {
      try {
        escrow.completionReason = EscrowCompletionReason.AUTO_RELEASED;
        await this.releaseFunds(escrow);
        released++;
        this.logger.log(`Auto-released escrow ${escrow.reference}`);
      } catch (e) {
        errors++;
        this.logger.error(`Auto-release failed for ${escrow.reference}: ${e.message}`);
      }
    }

    return { released, errors };
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  async findByOrder(orderId: string): Promise<EscrowTransaction | null> {
    return this.escrowRepo.findOne({ where: { orderId } });
  }

  async findById(id: string): Promise<EscrowTransaction> {
    const e = await this.escrowRepo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Escrow not found');
    return e;
  }

  async listAll(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const qb = this.escrowRepo.createQueryBuilder('e');
    if (status) qb.where('e.status = :status', { status });
    qb.orderBy('e.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listForBuyer(buyerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.escrowRepo.findAndCount({
      where: { buyerId },
      order: { createdAt: 'DESC' },
      skip, take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listForSeller(sellerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.escrowRepo.findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip, take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Internal Helpers ──────────────────────────────────────────────────────

  private async releaseFunds(escrow: EscrowTransaction): Promise<EscrowTransaction> {
    const secretKey = this.cfg.get<string>('paystack.secretKey');

    // Get seller's default bank account
    const bankAccount = escrow.sellerBankAccountId
      ? await this.bankRepo.findOne({ where: { id: escrow.sellerBankAccountId } })
      : await this.bankRepo.findOne({ where: { sellerId: escrow.sellerId, isDefault: true } });

    if (!bankAccount?.recipientCode) {
      this.logger.warn(`No bank account for seller ${escrow.sellerId} — escrow ${escrow.reference} needs manual release`);
      // Still mark as completed so buyer/seller know funds are being processed
      // Admin will handle manual transfer
      escrow.status = EscrowStatus.COMPLETED;
      escrow.releasedAt = new Date();
      escrow.adminNote = (escrow.adminNote || '') + ' [MANUAL RELEASE REQUIRED: no bank account on file]';
      return this.escrowRepo.save(escrow);
    }

    const amountKobo = Math.round(escrow.sellerAmount * 100);

    const res = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'balance',
        amount: amountKobo,
        recipient: bankAccount.recipientCode,
        reason: `Escrow release: ${escrow.reference}`,
        reference: `${escrow.reference}-PAYOUT`,
      }),
    });

    const data = await res.json() as any;
    if (!data.status) {
      throw new BadRequestException(data.message || 'Paystack transfer failed');
    }

    escrow.status = EscrowStatus.COMPLETED;
    escrow.transferReference = data.data?.transfer_code || `${escrow.reference}-PAYOUT`;
    escrow.sellerBankAccountId = bankAccount.id;
    escrow.releasedAt = new Date();
    return this.escrowRepo.save(escrow);
  }

  private async refundBuyer(escrow: EscrowTransaction): Promise<EscrowTransaction> {
    const secretKey = this.cfg.get<string>('paystack.secretKey');

    if (escrow.paymentReference) {
      const res = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: escrow.paymentReference,
          amount: Math.round(escrow.amount * 100),
        }),
      });
      const data = await res.json() as any;
      if (!data.status) {
        this.logger.warn(`Paystack refund failed for ${escrow.reference}: ${data.message}`);
      }
    }

    escrow.status = EscrowStatus.REFUNDED;
    escrow.releasedAt = new Date();
    return this.escrowRepo.save(escrow);
  }

  private async findAndAssertStatus(id: string, expectedStatus: EscrowStatus): Promise<EscrowTransaction> {
    const escrow = await this.escrowRepo.findOne({ where: { id } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.status !== expectedStatus) {
      throw new BadRequestException(`Expected escrow status ${expectedStatus}, got ${escrow.status}`);
    }
    return escrow;
  }
}
