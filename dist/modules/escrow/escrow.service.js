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
var EscrowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const escrow_entity_1 = require("./escrow.entity");
const seller_bank_account_entity_1 = require("./seller-bank-account.entity");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
const notifications_service_1 = require("../notifications/notifications.service");
let EscrowService = EscrowService_1 = class EscrowService {
    constructor(escrowRepo, bankRepo, settings, notif, cfg) {
        this.escrowRepo = escrowRepo;
        this.bankRepo = bankRepo;
        this.settings = settings;
        this.notif = notif;
        this.cfg = cfg;
        this.logger = new common_1.Logger(EscrowService_1.name);
    }
    async registerBankAccount(sellerId, bankCode, accountNumber) {
        const secretKey = this.cfg.get('paystack.secretKey');
        const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, { headers: { Authorization: `Bearer ${secretKey}` } });
        const data = await res.json();
        if (!data.status) {
            throw new common_1.BadRequestException(data.message || 'Could not verify bank account');
        }
        const accountName = data.data.account_name;
        const banksRes = await fetch('https://api.paystack.co/bank', {
            headers: { Authorization: `Bearer ${secretKey}` },
        });
        const banksData = await banksRes.json();
        const bank = (banksData.data || []).find((b) => b.code === bankCode);
        const bankName = bank?.name || bankCode;
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
        const recipientData = await recipientRes.json();
        if (!recipientData.status) {
            throw new common_1.BadRequestException(recipientData.message || 'Could not create transfer recipient');
        }
        const recipientCode = recipientData.data.recipient_code;
        const existing = await this.bankRepo.count({ where: { sellerId } });
        if (existing > 0) {
            await this.bankRepo.update({ sellerId, isDefault: true }, { isDefault: false });
        }
        return this.bankRepo.save(this.bankRepo.create({
            sellerId, bankCode, bankName, accountNumber,
            accountName, recipientCode,
            isVerified: true,
            isDefault: true,
        }));
    }
    async getBankAccounts(sellerId) {
        return this.bankRepo.find({ where: { sellerId }, order: { createdAt: 'DESC' } });
    }
    async deleteBankAccount(id, sellerId) {
        const account = await this.bankRepo.findOne({ where: { id, sellerId } });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found');
        await this.bankRepo.remove(account);
    }
    async initiate(orderId, buyerId, sellerId, amount, currency) {
        const existing = await this.escrowRepo.findOne({ where: { orderId } });
        if (existing) {
            if (existing.status === escrow_entity_1.EscrowStatus.CANCELLED) {
                await this.escrowRepo.remove(existing);
            }
            else {
                throw new common_1.BadRequestException('Escrow already exists for this order');
            }
        }
        const feePercent = await this.settings.getNumber('escrow_fee_percent');
        const feeAmount = parseFloat(((amount * feePercent) / 100).toFixed(2));
        const sellerAmount = parseFloat((amount - feeAmount).toFixed(2));
        const reference = `ESC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const escrow = await this.escrowRepo.save(this.escrowRepo.create({
            reference, orderId, buyerId, sellerId,
            amount, feePercent, feeAmount, sellerAmount, currency,
            status: escrow_entity_1.EscrowStatus.PENDING_AGREEMENT,
        }));
        this.logger.log(`Escrow initiated: ${escrow.reference} — order ${orderId}`);
        return escrow;
    }
    async sellerRespond(escrowId, sellerId, decision, reason) {
        const escrow = await this.findAndAssertStatus(escrowId, escrow_entity_1.EscrowStatus.PENDING_AGREEMENT);
        if (escrow.sellerId !== sellerId)
            throw new common_1.ForbiddenException('Not your escrow');
        if (decision === 'accept') {
            escrow.status = escrow_entity_1.EscrowStatus.AWAITING_PAYMENT;
            escrow.sellerAgreedAt = new Date();
        }
        else {
            escrow.status = escrow_entity_1.EscrowStatus.CANCELLED;
            escrow.sellerDeclinedAt = new Date();
            escrow.cancelledAt = new Date();
            escrow.cancelReason = reason || 'Seller declined escrow';
        }
        return this.escrowRepo.save(escrow);
    }
    async initiateFunding(escrowId, buyerId, email, currency) {
        const escrow = await this.findAndAssertStatus(escrowId, escrow_entity_1.EscrowStatus.AWAITING_PAYMENT);
        if (escrow.buyerId !== buyerId)
            throw new common_1.ForbiddenException('Not your escrow');
        const secretKey = this.cfg.get('paystack.secretKey');
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
        const data = await res.json();
        if (!data.status)
            throw new common_1.BadRequestException(data.message || 'Paystack init failed');
        return { provider: 'paystack', reference: escrow.reference, paymentUrl: data.data.authorization_url };
    }
    async confirmFunding(reference) {
        const escrow = await this.escrowRepo.findOne({ where: { reference } });
        if (!escrow)
            throw new common_1.NotFoundException(`Escrow not found for reference: ${reference}`);
        if (escrow.status !== escrow_entity_1.EscrowStatus.AWAITING_PAYMENT)
            return escrow;
        const secretKey = this.cfg.get('paystack.secretKey');
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${secretKey}` },
        });
        const data = await res.json();
        if (!data.status || data.data.status !== 'success') {
            throw new common_1.BadRequestException('Payment verification failed');
        }
        escrow.status = escrow_entity_1.EscrowStatus.FUNDED;
        escrow.paymentReference = reference;
        escrow.paymentProvider = 'paystack';
        escrow.fundedAt = new Date();
        return this.escrowRepo.save(escrow);
    }
    async markShipped(escrowId, sellerId, trackingInfo) {
        const escrow = await this.findAndAssertStatus(escrowId, escrow_entity_1.EscrowStatus.FUNDED);
        if (escrow.sellerId !== sellerId)
            throw new common_1.ForbiddenException('Not your escrow');
        const autoReleaseDays = await this.settings.getNumber('escrow_auto_release_days');
        const autoReleaseAt = new Date(Date.now() + autoReleaseDays * 86400000);
        escrow.status = escrow_entity_1.EscrowStatus.SHIPPED;
        escrow.trackingInfo = trackingInfo;
        escrow.shippedAt = new Date();
        escrow.autoReleaseAt = autoReleaseAt;
        return this.escrowRepo.save(escrow);
    }
    async confirmDelivery(escrowId, buyerId) {
        const escrow = await this.findAndAssertStatus(escrowId, escrow_entity_1.EscrowStatus.SHIPPED);
        if (escrow.buyerId !== buyerId)
            throw new common_1.ForbiddenException('Not your escrow');
        escrow.confirmedAt = new Date();
        escrow.completionReason = escrow_entity_1.EscrowCompletionReason.BUYER_CONFIRMED;
        return this.releaseFunds(escrow);
    }
    async raiseDispute(escrowId, buyerId, reason, evidence) {
        const escrow = await this.escrowRepo.findOne({ where: { id: escrowId } });
        if (!escrow)
            throw new common_1.NotFoundException('Escrow not found');
        if (escrow.buyerId !== buyerId)
            throw new common_1.ForbiddenException('Not your escrow');
        const allowedStatuses = [escrow_entity_1.EscrowStatus.FUNDED, escrow_entity_1.EscrowStatus.SHIPPED];
        if (!allowedStatuses.includes(escrow.status)) {
            throw new common_1.BadRequestException(`Cannot raise dispute on an escrow with status: ${escrow.status}`);
        }
        escrow.status = escrow_entity_1.EscrowStatus.DISPUTED;
        escrow.disputedAt = new Date();
        this.logger.log(`Escrow ${escrow.reference} disputed by buyer. Reason: ${reason}`);
        return this.escrowRepo.save(escrow);
    }
    async resolveDispute(escrowId, decision, note) {
        const escrow = await this.findAndAssertStatus(escrowId, escrow_entity_1.EscrowStatus.DISPUTED);
        escrow.adminNote = note;
        escrow.completionReason = escrow_entity_1.EscrowCompletionReason.ADMIN_DECISION;
        if (decision === 'release') {
            return this.releaseFunds(escrow);
        }
        else {
            return this.refundBuyer(escrow);
        }
    }
    async adminCancel(escrowId, reason) {
        const escrow = await this.escrowRepo.findOne({ where: { id: escrowId } });
        if (!escrow)
            throw new common_1.NotFoundException('Escrow not found');
        if ([escrow_entity_1.EscrowStatus.COMPLETED, escrow_entity_1.EscrowStatus.REFUNDED].includes(escrow.status)) {
            throw new common_1.BadRequestException('Cannot cancel a completed or already-refunded escrow');
        }
        escrow.status = escrow_entity_1.EscrowStatus.CANCELLED;
        escrow.cancelReason = reason;
        escrow.cancelledAt = new Date();
        return this.escrowRepo.save(escrow);
    }
    async processAutoReleases() {
        const overdue = await this.escrowRepo.find({
            where: { status: escrow_entity_1.EscrowStatus.SHIPPED, autoReleaseAt: (0, typeorm_2.LessThan)(new Date()) },
        });
        let released = 0;
        let errors = 0;
        for (const escrow of overdue) {
            try {
                escrow.completionReason = escrow_entity_1.EscrowCompletionReason.AUTO_RELEASED;
                await this.releaseFunds(escrow);
                released++;
                this.logger.log(`Auto-released escrow ${escrow.reference}`);
            }
            catch (e) {
                errors++;
                this.logger.error(`Auto-release failed for ${escrow.reference}: ${e.message}`);
            }
        }
        return { released, errors };
    }
    async findByOrder(orderId) {
        return this.escrowRepo.findOne({ where: { orderId } });
    }
    async findById(id) {
        const e = await this.escrowRepo.findOne({ where: { id } });
        if (!e)
            throw new common_1.NotFoundException('Escrow not found');
        return e;
    }
    async listAll(page, limit, status) {
        const skip = (page - 1) * limit;
        const qb = this.escrowRepo.createQueryBuilder('e');
        if (status)
            qb.where('e.status = :status', { status });
        qb.orderBy('e.createdAt', 'DESC').skip(skip).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async listForBuyer(buyerId, page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.escrowRepo.findAndCount({
            where: { buyerId },
            order: { createdAt: 'DESC' },
            skip, take: limit,
        });
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async listForSeller(sellerId, page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.escrowRepo.findAndCount({
            where: { sellerId },
            order: { createdAt: 'DESC' },
            skip, take: limit,
        });
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async releaseFunds(escrow) {
        const secretKey = this.cfg.get('paystack.secretKey');
        const bankAccount = escrow.sellerBankAccountId
            ? await this.bankRepo.findOne({ where: { id: escrow.sellerBankAccountId } })
            : await this.bankRepo.findOne({ where: { sellerId: escrow.sellerId, isDefault: true } });
        if (!bankAccount?.recipientCode) {
            this.logger.warn(`No bank account for seller ${escrow.sellerId} — escrow ${escrow.reference} needs manual release`);
            escrow.status = escrow_entity_1.EscrowStatus.COMPLETED;
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
        const data = await res.json();
        if (!data.status) {
            throw new common_1.BadRequestException(data.message || 'Paystack transfer failed');
        }
        escrow.status = escrow_entity_1.EscrowStatus.COMPLETED;
        escrow.transferReference = data.data?.transfer_code || `${escrow.reference}-PAYOUT`;
        escrow.sellerBankAccountId = bankAccount.id;
        escrow.releasedAt = new Date();
        return this.escrowRepo.save(escrow);
    }
    async refundBuyer(escrow) {
        const secretKey = this.cfg.get('paystack.secretKey');
        if (escrow.paymentReference) {
            const res = await fetch('https://api.paystack.co/refund', {
                method: 'POST',
                headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction: escrow.paymentReference,
                    amount: Math.round(escrow.amount * 100),
                }),
            });
            const data = await res.json();
            if (!data.status) {
                this.logger.warn(`Paystack refund failed for ${escrow.reference}: ${data.message}`);
            }
        }
        escrow.status = escrow_entity_1.EscrowStatus.REFUNDED;
        escrow.releasedAt = new Date();
        return this.escrowRepo.save(escrow);
    }
    async findAndAssertStatus(id, expectedStatus) {
        const escrow = await this.escrowRepo.findOne({ where: { id } });
        if (!escrow)
            throw new common_1.NotFoundException('Escrow not found');
        if (escrow.status !== expectedStatus) {
            throw new common_1.BadRequestException(`Expected escrow status ${expectedStatus}, got ${escrow.status}`);
        }
        return escrow;
    }
};
exports.EscrowService = EscrowService;
exports.EscrowService = EscrowService = EscrowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(escrow_entity_1.EscrowTransaction)),
    __param(1, (0, typeorm_1.InjectRepository)(seller_bank_account_entity_1.SellerBankAccount)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        platform_settings_service_1.PlatformSettingsService,
        notifications_service_1.NotificationsService,
        config_1.ConfigService])
], EscrowService);
//# sourceMappingURL=escrow.service.js.map