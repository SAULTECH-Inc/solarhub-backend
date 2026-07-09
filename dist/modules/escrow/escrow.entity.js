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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowTransaction = exports.EscrowCompletionReason = exports.EscrowStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
var EscrowStatus;
(function (EscrowStatus) {
    EscrowStatus["PENDING_AGREEMENT"] = "pending_agreement";
    EscrowStatus["AWAITING_PAYMENT"] = "awaiting_payment";
    EscrowStatus["FUNDED"] = "funded";
    EscrowStatus["SHIPPED"] = "shipped";
    EscrowStatus["COMPLETED"] = "completed";
    EscrowStatus["DISPUTED"] = "disputed";
    EscrowStatus["REFUNDED"] = "refunded";
    EscrowStatus["CANCELLED"] = "cancelled";
})(EscrowStatus || (exports.EscrowStatus = EscrowStatus = {}));
var EscrowCompletionReason;
(function (EscrowCompletionReason) {
    EscrowCompletionReason["BUYER_CONFIRMED"] = "buyer_confirmed";
    EscrowCompletionReason["AUTO_RELEASED"] = "auto_released";
    EscrowCompletionReason["ADMIN_DECISION"] = "admin_decision";
})(EscrowCompletionReason || (exports.EscrowCompletionReason = EscrowCompletionReason = {}));
let EscrowTransaction = class EscrowTransaction {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, reference: { required: true, type: () => String }, orderId: { required: true, type: () => String }, buyerId: { required: true, type: () => String }, sellerId: { required: true, type: () => String }, amount: { required: true, type: () => Number }, feePercent: { required: true, type: () => Number }, feeAmount: { required: true, type: () => Number }, sellerAmount: { required: true, type: () => Number }, currency: { required: true, type: () => String }, status: { required: true, enum: require("./escrow.entity").EscrowStatus }, paymentReference: { required: true, type: () => String }, paymentProvider: { required: true, type: () => String }, transferReference: { required: true, type: () => String }, sellerBankAccountId: { required: true, type: () => String }, trackingInfo: { required: true, type: () => ({ carrier: { required: false, type: () => String }, trackingNumber: { required: false, type: () => String }, trackingUrl: { required: false, type: () => String }, note: { required: false, type: () => String } }) }, disputeId: { required: true, type: () => String }, autoReleaseAt: { required: true, type: () => Date }, completionReason: { required: true, enum: require("./escrow.entity").EscrowCompletionReason }, adminNote: { required: true, type: () => String }, cancelReason: { required: true, type: () => String }, sellerAgreedAt: { required: true, type: () => Date }, sellerDeclinedAt: { required: true, type: () => Date }, fundedAt: { required: true, type: () => Date }, shippedAt: { required: true, type: () => Date }, confirmedAt: { required: true, type: () => Date }, releasedAt: { required: true, type: () => Date }, cancelledAt: { required: true, type: () => Date }, disputedAt: { required: true, type: () => Date }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.EscrowTransaction = EscrowTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 30 }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "buyerId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], EscrowTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 1.5 }),
    __metadata("design:type", Number)
], EscrowTransaction.prototype, "feePercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EscrowTransaction.prototype, "feeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EscrowTransaction.prototype, "sellerAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: 'NGN' }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.PENDING_AGREEMENT }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "paymentReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 30 }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "paymentProvider", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "transferReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "sellerBankAccountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], EscrowTransaction.prototype, "trackingInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "disputeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "autoReleaseAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EscrowCompletionReason, nullable: true }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "completionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "adminNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EscrowTransaction.prototype, "cancelReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "sellerAgreedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "sellerDeclinedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "fundedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "shippedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "releasedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "disputedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EscrowTransaction.prototype, "updatedAt", void 0);
exports.EscrowTransaction = EscrowTransaction = __decorate([
    (0, typeorm_1.Entity)('escrow_transactions'),
    (0, typeorm_1.Index)(['orderId'], { unique: true }),
    (0, typeorm_1.Index)(['buyerId']),
    (0, typeorm_1.Index)(['sellerId']),
    (0, typeorm_1.Index)(['status'])
], EscrowTransaction);
//# sourceMappingURL=escrow.entity.js.map