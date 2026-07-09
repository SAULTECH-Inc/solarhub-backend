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
exports.AdvisorController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const advisor_service_1 = require("./advisor.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const decorators_1 = require("../../common/decorators");
let AdvisorController = class AdvisorController {
    constructor(svc) {
        this.svc = svc;
    }
    calculate(body, user) {
        return this.svc.calculate(body.appliances, body.preferences, user?.id);
    }
    chat(body) {
        return this.svc.chatWithBot(body.message, body.history);
    }
    getSessions(uid) {
        return this.svc.getUserSessions(uid);
    }
    getSession(id) {
        return this.svc.getSession(id);
    }
    saveSelection(id, recId) {
        return this.svc.saveSelection(id, recId);
    }
    getMarketplaceItems(id, tier, preference) {
        const pref = ['budget', 'quality', 'balanced'].includes(preference)
            ? preference
            : 'balanced';
        return this.svc.getMarketplaceItemsForSession(id, tier || 'budget', pref);
    }
};
exports.AdvisorController = AdvisorController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('calculate'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate 3 solar system recommendations (Claude AI)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdvisorController.prototype, "calculate", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('chat'),
    (0, swagger_1.ApiOperation)({ summary: 'SolarBot AI chat (REST fallback when WebSocket unavailable)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdvisorController.prototype, "chat", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('sessions'),
    openapi.ApiResponse({ status: 200, type: [require("./advisor.entity").AdvisorSession] }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdvisorController.prototype, "getSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('sessions/:id'),
    openapi.ApiResponse({ status: 200, type: require("./advisor.entity").AdvisorSession }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdvisorController.prototype, "getSession", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('sessions/:id/select'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('recommendationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdvisorController.prototype, "saveSelection", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('sessions/:id/marketplace-items'),
    (0, swagger_1.ApiOperation)({ summary: 'Get marketplace products matching a recommendation tier' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('tier')),
    __param(2, (0, common_1.Query)('preference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdvisorController.prototype, "getMarketplaceItems", null);
exports.AdvisorController = AdvisorController = __decorate([
    (0, swagger_1.ApiTags)('Advisor'),
    (0, common_1.Controller)('advisor'),
    __metadata("design:paramtypes", [advisor_service_1.AdvisorService])
], AdvisorController);
//# sourceMappingURL=advisor.controller.js.map