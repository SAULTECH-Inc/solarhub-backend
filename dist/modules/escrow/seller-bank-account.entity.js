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
exports.SellerBankAccount = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let SellerBankAccount = class SellerBankAccount {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, sellerId: { required: true, type: () => String }, bankName: { required: true, type: () => String }, bankCode: { required: true, type: () => String }, accountNumber: { required: true, type: () => String }, accountName: { required: true, type: () => String }, recipientCode: { required: true, type: () => String }, isVerified: { required: true, type: () => Boolean }, isDefault: { required: true, type: () => Boolean }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.SellerBankAccount = SellerBankAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SellerBankAccount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SellerBankAccount.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], SellerBankAccount.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], SellerBankAccount.prototype, "bankCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], SellerBankAccount.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], SellerBankAccount.prototype, "accountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], SellerBankAccount.prototype, "recipientCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SellerBankAccount.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SellerBankAccount.prototype, "isDefault", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SellerBankAccount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SellerBankAccount.prototype, "updatedAt", void 0);
exports.SellerBankAccount = SellerBankAccount = __decorate([
    (0, typeorm_1.Entity)('seller_bank_accounts'),
    (0, typeorm_1.Index)(['sellerId'])
], SellerBankAccount);
//# sourceMappingURL=seller-bank-account.entity.js.map