import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EscrowTransaction } from './escrow.entity';
import { SellerBankAccount } from './seller-bank-account.entity';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class EscrowService {
    private readonly escrowRepo;
    private readonly bankRepo;
    private readonly settings;
    private readonly notif;
    private readonly cfg;
    private readonly logger;
    constructor(escrowRepo: Repository<EscrowTransaction>, bankRepo: Repository<SellerBankAccount>, settings: PlatformSettingsService, notif: NotificationsService, cfg: ConfigService);
    registerBankAccount(sellerId: string, bankCode: string, accountNumber: string): Promise<SellerBankAccount>;
    getBankAccounts(sellerId: string): Promise<SellerBankAccount[]>;
    deleteBankAccount(id: string, sellerId: string): Promise<void>;
    initiate(orderId: string, buyerId: string, sellerId: string, amount: number, currency: string): Promise<EscrowTransaction>;
    sellerRespond(escrowId: string, sellerId: string, decision: 'accept' | 'decline', reason?: string): Promise<EscrowTransaction>;
    initiateFunding(escrowId: string, buyerId: string, email: string, currency: string): Promise<{
        provider: string;
        reference: string;
        paymentUrl: string;
    }>;
    confirmFunding(reference: string): Promise<EscrowTransaction>;
    markShipped(escrowId: string, sellerId: string, trackingInfo: {
        carrier?: string;
        trackingNumber?: string;
        trackingUrl?: string;
        note?: string;
    }): Promise<EscrowTransaction>;
    confirmDelivery(escrowId: string, buyerId: string): Promise<EscrowTransaction>;
    raiseDispute(escrowId: string, buyerId: string, reason: string, evidence?: string[]): Promise<EscrowTransaction>;
    resolveDispute(escrowId: string, decision: 'release' | 'refund', note: string): Promise<EscrowTransaction>;
    adminCancel(escrowId: string, reason: string): Promise<EscrowTransaction>;
    processAutoReleases(): Promise<{
        released: number;
        errors: number;
    }>;
    findByOrder(orderId: string): Promise<EscrowTransaction | null>;
    findById(id: string): Promise<EscrowTransaction>;
    listAll(page: number, limit: number, status?: string): Promise<{
        data: EscrowTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    listForBuyer(buyerId: string, page: number, limit: number): Promise<{
        data: EscrowTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    listForSeller(sellerId: string, page: number, limit: number): Promise<{
        data: EscrowTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    private releaseFunds;
    private refundBuyer;
    private findAndAssertStatus;
}
