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
exports.RfqsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rfqs_service_1 = require("./rfqs.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const decorators_1 = require("../../common/decorators");
const user_entity_1 = require("../users/user.entity");
let RfqsController = class RfqsController {
    constructor(svc) {
        this.svc = svc;
    }
    createRfq(uid, dto) {
        return this.svc.createRfq(uid, dto);
    }
    getMyRfqs(uid, p = 1, l = 20) {
        return this.svc.getMyRfqs(uid, +p, +l);
    }
    acceptBid(uid, bidId) {
        return this.svc.acceptBid(uid, bidId);
    }
    getOpenRfqs(state, city, p = 1, l = 20) {
        return this.svc.getOpenRfqs(state, city, +p, +l);
    }
    submitBid(user, rfqId, dto) {
        return this.svc.submitBid(user, rfqId, dto);
    }
};
exports.RfqsController = RfqsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new RFQ (Buyer)' }),
    openapi.ApiResponse({ status: 201, type: require("./rfq.entity").Rfq }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RfqsController.prototype, "createRfq", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get buyer RFQs' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RfqsController.prototype, "getMyRfqs", null);
__decorate([
    (0, common_1.Patch)('bids/:id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a bid (Buyer)' }),
    openapi.ApiResponse({ status: 200, type: require("./rfq.entity").RfqBid }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RfqsController.prototype, "acceptBid", null);
__decorate([
    (0, common_1.Get)('board'),
    (0, swagger_1.ApiOperation)({ summary: 'Job Board - Get open RFQs (Contractor)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('state')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], RfqsController.prototype, "getOpenRfqs", null);
__decorate([
    (0, common_1.Post)(':id/bids'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a bid to an RFQ (Contractor)' }),
    openapi.ApiResponse({ status: 201, type: require("./rfq.entity").RfqBid }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, Object]),
    __metadata("design:returntype", void 0)
], RfqsController.prototype, "submitBid", null);
exports.RfqsController = RfqsController = __decorate([
    (0, swagger_1.ApiTags)('RFQs'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('rfqs'),
    __metadata("design:paramtypes", [rfqs_service_1.RfqsService])
], RfqsController);
//# sourceMappingURL=rfqs.controller.js.map