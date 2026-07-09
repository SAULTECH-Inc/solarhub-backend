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
exports.SubscriptionInvoice = exports.InvoiceStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["PENDING"] = "pending";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["FAILED"] = "failed";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
let SubscriptionInvoice = class SubscriptionInvoice {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, userId: { required: true, type: () => String }, plan: { required: true, type: () => String }, amount: { required: true, type: () => Number }, currency: { required: true, type: () => String }, provider: { required: true, type: () => String }, reference: { required: true, type: () => String }, status: { required: true, enum: require("./subscription-invoice.entity").InvoiceStatus }, gatewayTransactionId: { required: true, type: () => String }, paidAt: { required: true, type: () => Date }, periodStart: { required: true, type: () => Date }, periodEnd: { required: true, type: () => Date }, gatewayData: { required: true, type: () => Object }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.SubscriptionInvoice = SubscriptionInvoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SubscriptionInvoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SubscriptionInvoice.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], SubscriptionInvoice.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], SubscriptionInvoice.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3 }),
    __metadata("design:type", String)
], SubscriptionInvoice.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'paystack' }),
    __metadata("design:type", String)
], SubscriptionInvoice.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 100 }),
    __metadata("design:type", String)
], SubscriptionInvoice.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING }),
    __metadata("design:type", String)
], SubscriptionInvoice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 200 }),
    __metadata("design:type", String)
], SubscriptionInvoice.prototype, "gatewayTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], SubscriptionInvoice.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], SubscriptionInvoice.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], SubscriptionInvoice.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SubscriptionInvoice.prototype, "gatewayData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SubscriptionInvoice.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SubscriptionInvoice.prototype, "updatedAt", void 0);
exports.SubscriptionInvoice = SubscriptionInvoice = __decorate([
    (0, typeorm_1.Entity)('subscription_invoices'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['reference'], { unique: true })
], SubscriptionInvoice);
//# sourceMappingURL=subscription-invoice.entity.js.map