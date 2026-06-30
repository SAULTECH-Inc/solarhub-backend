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
exports.Payment = exports.TxStatus = exports.PaymentMethod = exports.PaymentProvider = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["PAYSTACK"] = "paystack";
    PaymentProvider["STRIPE"] = "stripe";
    PaymentProvider["FLUTTERWAVE"] = "flutterwave";
    PaymentProvider["PADDLE"] = "paddle";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "card";
    PaymentMethod["TRANSFER"] = "bank_transfer";
    PaymentMethod["USSD"] = "ussd";
    PaymentMethod["MOBILE_MONEY"] = "mobile_money";
    PaymentMethod["CASH"] = "cash";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var TxStatus;
(function (TxStatus) {
    TxStatus["PENDING"] = "pending";
    TxStatus["SUCCESS"] = "success";
    TxStatus["FAILED"] = "failed";
    TxStatus["REFUNDED"] = "refunded";
    TxStatus["CANCELLED"] = "cancelled";
})(TxStatus || (exports.TxStatus = TxStatus = {}));
let Payment = class Payment {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, orderId: { required: true, type: () => String }, userId: { required: true, type: () => String }, reference: { required: true, type: () => String }, amount: { required: true, type: () => Number }, currency: { required: true, type: () => String }, provider: { required: true, enum: require("./payment.entity").PaymentProvider }, method: { required: true, enum: require("./payment.entity").PaymentMethod }, status: { required: true, enum: require("./payment.entity").TxStatus }, gatewayTransactionId: { required: true, type: () => String }, paidAt: { required: true, type: () => Date }, failureReason: { required: true, type: () => String }, metadata: { required: true, type: () => Object }, refundAmount: { required: true, type: () => Number }, refundedAt: { required: true, type: () => Date }, refundReason: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.Payment = Payment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Payment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Payment.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Payment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 100 }),
    __metadata("design:type", String)
], Payment.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3 }),
    __metadata("design:type", String)
], Payment.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PaymentProvider }),
    __metadata("design:type", String)
], Payment.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PaymentMethod, nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TxStatus, default: TxStatus.PENDING }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 200 }),
    __metadata("design:type", String)
], Payment.prototype, "gatewayTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Payment.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], Payment.prototype, "failureReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Payment.prototype, "refundAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Payment.prototype, "refundedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], Payment.prototype, "refundReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Payment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Payment.prototype, "updatedAt", void 0);
exports.Payment = Payment = __decorate([
    (0, typeorm_1.Entity)('payments'),
    (0, typeorm_1.Index)(['orderId']),
    (0, typeorm_1.Index)(['reference'], { unique: true })
], Payment);
//# sourceMappingURL=payment.entity.js.map