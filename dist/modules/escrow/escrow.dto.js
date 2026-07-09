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
exports.ResolveDisputeDto = exports.RaiseDisputeDto = exports.MarkShippedDto = exports.FundEscrowDto = exports.SellerRespondDto = exports.RegisterBankAccountDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterBankAccountDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { bankCode: { required: true, type: () => String }, accountNumber: { required: true, type: () => String } };
    }
}
exports.RegisterBankAccountDto = RegisterBankAccountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '044' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterBankAccountDto.prototype, "bankCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0123456789' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterBankAccountDto.prototype, "accountNumber", void 0);
class SellerRespondDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { decision: { required: true, type: () => Object, enum: ['accept', 'decline'] }, reason: { required: false, type: () => String } };
    }
}
exports.SellerRespondDto = SellerRespondDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['accept', 'decline'] }),
    (0, class_validator_1.IsIn)(['accept', 'decline']),
    __metadata("design:type", String)
], SellerRespondDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SellerRespondDto.prototype, "reason", void 0);
class FundEscrowDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { currency: { required: true, type: () => String }, email: { required: true, type: () => String } };
    }
}
exports.FundEscrowDto = FundEscrowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NGN' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FundEscrowDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'buyer@email.com' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FundEscrowDto.prototype, "email", void 0);
class MarkShippedDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { carrier: { required: false, type: () => String }, trackingNumber: { required: false, type: () => String }, trackingUrl: { required: false, type: () => String }, note: { required: false, type: () => String } };
    }
}
exports.MarkShippedDto = MarkShippedDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'DHL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkShippedDto.prototype, "carrier", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1Z999AA10123456784' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkShippedDto.prototype, "trackingNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkShippedDto.prototype, "trackingUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkShippedDto.prototype, "note", void 0);
class RaiseDisputeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String }, evidence: { required: false, type: () => [String] } };
    }
}
exports.RaiseDisputeDto = RaiseDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Item arrived damaged' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RaiseDisputeDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['https://cloudinary.com/evidence1.jpg'] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], RaiseDisputeDto.prototype, "evidence", void 0);
class ResolveDisputeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { decision: { required: true, type: () => Object, enum: ['release', 'refund'] }, note: { required: true, type: () => String } };
    }
}
exports.ResolveDisputeDto = ResolveDisputeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['release', 'refund'] }),
    (0, class_validator_1.IsIn)(['release', 'refund']),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "note", void 0);
//# sourceMappingURL=escrow.dto.js.map