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
exports.EngineersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const engineers_service_1 = require("./engineers.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const decorators_1 = require("../../common/decorators");
const engineer_entity_1 = require("./engineer.entity");
let EngineersController = class EngineersController {
    constructor(svc) {
        this.svc = svc;
    }
    search(page = 1, limit = 20, city, state, specialization, minRating, availableOnly, minYears) {
        const filters = {
            city, state, specialization,
            minRating: minRating ? +minRating : undefined,
            minYears: minYears ? +minYears : undefined,
            availableOnly: availableOnly === 'true',
        };
        return this.svc.search(filters, +page, +limit);
    }
    getPublic(id) {
        return this.svc.getPublicProfile(id);
    }
    getMyProfile(uid) {
        return this.svc.getOwnProfile(uid);
    }
    create(uid, dto) {
        return this.svc.createProfile(uid, dto);
    }
    update(uid, dto) {
        return this.svc.updateProfile(uid, dto);
    }
    listAll(page = 1, limit = 20, status, state) {
        return this.svc.listAll(+page, +limit, { status, state });
    }
    updateStatus(id, status, adminNote) {
        return this.svc.updateStatus(id, status, adminNote);
    }
    verify(id) {
        return this.svc.verifyEngineer(id);
    }
};
exports.EngineersController = EngineersController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search / list engineers (public)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'state', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'specialization', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'minRating', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'availableOnly', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'minYears', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('city')),
    __param(3, (0, common_1.Query)('state')),
    __param(4, (0, common_1.Query)('specialization')),
    __param(5, (0, common_1.Query)('minRating')),
    __param(6, (0, common_1.Query)('availableOnly')),
    __param(7, (0, common_1.Query)('minYears')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, Number, String, Number]),
    __metadata("design:returntype", void 0)
], EngineersController.prototype, "search", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public engineer profile' }),
    openapi.ApiResponse({ status: 200, type: require("./engineer.entity").Engineer }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EngineersController.prototype, "getPublic", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('profile/me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own engineer profile' }),
    openapi.ApiResponse({ status: 200, type: require("./engineer.entity").Engineer }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EngineersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Create engineer profile (becomes engineer)' }),
    openapi.ApiResponse({ status: 201, type: require("./engineer.entity").Engineer }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EngineersController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update own engineer profile' }),
    openapi.ApiResponse({ status: 200, type: require("./engineer.entity").Engineer }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EngineersController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('admin/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list all engineers' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], EngineersController.prototype, "listAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('admin/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: update engineer status (flag/suspend/activate)' }),
    openapi.ApiResponse({ status: 200, type: require("./engineer.entity").Engineer }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('adminNote')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EngineersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('admin/:id/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: mark engineer as verified' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("./engineer.entity").Engineer }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EngineersController.prototype, "verify", null);
exports.EngineersController = EngineersController = __decorate([
    (0, swagger_1.ApiTags)('Engineers'),
    (0, common_1.Controller)('engineers'),
    __metadata("design:paramtypes", [engineers_service_1.EngineersService])
], EngineersController);
//# sourceMappingURL=engineers.controller.js.map