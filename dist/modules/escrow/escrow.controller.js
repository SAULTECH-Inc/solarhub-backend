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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const escrow_service_1 = require("./escrow.service");
const escrow_feature_guard_1 = require("./escrow-feature.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const decorators_1 = require("../../common/decorators");
const escrow_dto_1 = require("./escrow.dto");
let EscrowController = class EscrowController {
    constructor(svc) {
        this.svc = svc;
    }
    registerBankAccount(req, dto) {
        return this.svc.registerBankAccount(req.user.id, dto.bankCode, dto.accountNumber);
    }
    getBankAccounts(req) {
        return this.svc.getBankAccounts(req.user.id);
    }
    initiate(req, orderId, sellerId, amount, currency) {
        return this.svc.initiate(orderId, req.user.id, sellerId, amount, currency);
    }
    sellerRespond(req, id, dto) {
        return this.svc.sellerRespond(id, req.user.id, dto.decision, dto.reason);
    }
    fundEscrow(req, id, dto) {
        return this.svc.initiateFunding(id, req.user.id, dto.email, dto.currency);
    }
    verifyFunding(reference) {
        return this.svc.confirmFunding(reference);
    }
    markShipped(req, id, dto) {
        return this.svc.markShipped(id, req.user.id, dto);
    }
    confirmDelivery(req, id) {
        return this.svc.confirmDelivery(id, req.user.id);
    }
    raiseDispute(req, id, dto) {
        return this.svc.raiseDispute(id, req.user.id, dto.reason, dto.evidence);
    }
    getByOrder(orderId) {
        return this.svc.findByOrder(orderId);
    }
    myBuyerEscrows(req, p = 1, l = 20) {
        return this.svc.listForBuyer(req.user.id, +p, +l);
    }
    mySellerEscrows(req, p = 1, l = 20) {
        return this.svc.listForSeller(req.user.id, +p, +l);
    }
    getOne(id) {
        return this.svc.findById(id);
    }
    listAll(p = 1, l = 20, status) {
        return this.svc.listAll(+p, +l, status);
    }
    resolveDispute(id, dto) {
        return this.svc.resolveDispute(id, dto.decision, dto.note);
    }
    adminCancel(id, reason) {
        return this.svc.adminCancel(id, reason);
    }
};
exports.EscrowController = EscrowController;
__decorate([
    (0, common_1.Post)('bank-account'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('seller'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a bank account for escrow payouts' }),
    openapi.ApiResponse({ status: 201, type: require("./seller-bank-account.entity").SellerBankAccount }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, escrow_dto_1.RegisterBankAccountDto]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "registerBankAccount", null);
__decorate([
    (0, common_1.Get)('bank-account'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('seller'),
    (0, swagger_1.ApiOperation)({ summary: 'List my bank accounts' }),
    openapi.ApiResponse({ status: 200, type: [require("./seller-bank-account.entity").SellerBankAccount] }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "getBankAccounts", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/initiate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('buyer'),
    (0, swagger_1.ApiOperation)({ summary: 'Buyer initiates an escrow agreement for an order' }),
    openapi.ApiResponse({ status: 201, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)('sellerId')),
    __param(3, (0, common_1.Body)('amount')),
    __param(4, (0, common_1.Body)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, String]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "initiate", null);
__decorate([
    (0, common_1.Patch)(':id/respond'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('seller'),
    (0, swagger_1.ApiOperation)({ summary: 'Seller accepts or declines the escrow proposal' }),
    openapi.ApiResponse({ status: 200, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, escrow_dto_1.SellerRespondDto]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "sellerRespond", null);
__decorate([
    (0, common_1.Post)(':id/fund'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('buyer'),
    (0, swagger_1.ApiOperation)({ summary: 'Buyer initiates payment to fund escrow (returns Paystack URL)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, escrow_dto_1.FundEscrowDto]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "fundEscrow", null);
__decorate([
    (0, common_1.Post)('verify/:reference'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('buyer'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify payment and mark escrow as funded (call after Paystack redirect)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Param)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "verifyFunding", null);
__decorate([
    (0, common_1.Patch)(':id/mark-shipped'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('seller'),
    (0, swagger_1.ApiOperation)({ summary: 'Seller confirms goods have been shipped' }),
    openapi.ApiResponse({ status: 200, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, escrow_dto_1.MarkShippedDto]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "markShipped", null);
__decorate([
    (0, common_1.Patch)(':id/confirm-delivery'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('buyer'),
    (0, swagger_1.ApiOperation)({ summary: 'Buyer confirms receipt and satisfaction — releases funds to seller' }),
    openapi.ApiResponse({ status: 200, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "confirmDelivery", null);
__decorate([
    (0, common_1.Post)(':id/dispute'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('buyer'),
    (0, swagger_1.ApiOperation)({ summary: 'Buyer raises a dispute — funds are held pending admin review' }),
    openapi.ApiResponse({ status: 201, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, escrow_dto_1.RaiseDisputeDto]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "raiseDispute", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get escrow details for an order' }),
    openapi.ApiResponse({ status: 200, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "getByOrder", null);
__decorate([
    (0, common_1.Get)('me/buying'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('buyer'),
    (0, swagger_1.ApiOperation)({ summary: 'List my escrows as buyer' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "myBuyerEscrows", null);
__decorate([
    (0, common_1.Get)('me/selling'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('seller'),
    (0, swagger_1.ApiOperation)({ summary: 'List my escrows as seller' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "mySellerEscrows", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single escrow by ID' }),
    openapi.ApiResponse({ status: 200, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] List all escrow transactions' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "listAll", null);
__decorate([
    (0, common_1.Patch)(':id/resolve-dispute'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Resolve a disputed escrow' }),
    openapi.ApiResponse({ status: 200, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, escrow_dto_1.ResolveDisputeDto]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Cancel an escrow (before funds have been released)' }),
    openapi.ApiResponse({ status: 200, type: require("./escrow.entity").EscrowTransaction }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "adminCancel", null);
exports.EscrowController = EscrowController = __decorate([
    (0, swagger_1.ApiTags)('Escrow'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, escrow_feature_guard_1.EscrowFeatureGuard),
    (0, common_1.Controller)('escrow'),
    __metadata("design:paramtypes", [escrow_service_1.EscrowService])
], EscrowController);
//# sourceMappingURL=escrow.controller.js.map