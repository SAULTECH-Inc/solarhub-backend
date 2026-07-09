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
exports.DisputesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const disputes_service_1 = require("./disputes.service");
const dispute_entity_1 = require("./dispute.entity");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const decorators_1 = require("../../common/decorators");
let DisputesController = class DisputesController {
    constructor(svc) {
        this.svc = svc;
    }
    create(uid, dto) {
        return this.svc.create(uid, dto);
    }
    getMyDisputes(uid, page, limit) {
        return this.svc.getMyDisputes(uid, page, limit);
    }
    getOne(id, uid) {
        return this.svc.getById(id, uid);
    }
    respond(id, uid, response) {
        return this.svc.addResponse(id, uid, response);
    }
    stats() {
        return this.svc.getStats();
    }
    adminListAll(page, limit, status, type, priority, search) {
        return this.svc.adminListAll(page, limit, { status, type, priority, search });
    }
    adminGetOne(id) {
        return this.svc.adminGetById(id);
    }
    adminUpdateStatus(id, status, adminNote, assignedToId) {
        return this.svc.adminUpdateStatus(id, status, adminNote, assignedToId);
    }
    adminSetPriority(id, priority) {
        return this.svc.adminSetPriority(id, priority);
    }
    adminResolve(id, resolution, resolutionNote) {
        return this.svc.adminResolve(id, resolution, resolutionNote);
    }
};
exports.DisputesController = DisputesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Raise a dispute or support ticket' }),
    openapi.ApiResponse({ status: 201, type: require("./dispute.entity").Dispute }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'List my disputes' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "getMyDisputes", null);
__decorate([
    (0, common_1.Get)('my/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single dispute (claimant or respondent only)' }),
    openapi.ApiResponse({ status: 200, type: require("./dispute.entity").Dispute }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)('my/:id/respond'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a response to a dispute (respondent)' }),
    openapi.ApiResponse({ status: 200, type: require("./dispute.entity").Dispute }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)('response')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "respond", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Get)('admin/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Dispute stats for admin dashboard' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "stats", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Get)('admin/all'),
    (0, swagger_1.ApiOperation)({ summary: 'List all disputes (admin)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('priority')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "adminListAll", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Get)('admin/:id'),
    openapi.ApiResponse({ status: 200, type: require("./dispute.entity").Dispute }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "adminGetOne", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Patch)('admin/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update dispute status' }),
    openapi.ApiResponse({ status: 200, type: require("./dispute.entity").Dispute }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('adminNote')),
    __param(3, (0, common_1.Body)('assignedToId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "adminUpdateStatus", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Patch)('admin/:id/priority'),
    (0, swagger_1.ApiOperation)({ summary: 'Set dispute priority' }),
    openapi.ApiResponse({ status: 200, type: require("./dispute.entity").Dispute }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "adminSetPriority", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Patch)('admin/:id/resolve'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a dispute with a decision' }),
    openapi.ApiResponse({ status: 200, type: require("./dispute.entity").Dispute }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('resolution')),
    __param(2, (0, common_1.Body)('resolutionNote')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "adminResolve", null);
exports.DisputesController = DisputesController = __decorate([
    (0, swagger_1.ApiTags)('Disputes'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('disputes'),
    __metadata("design:paramtypes", [disputes_service_1.DisputesService])
], DisputesController);
//# sourceMappingURL=disputes.controller.js.map