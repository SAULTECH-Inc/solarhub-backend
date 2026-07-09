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
exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const decorators_1 = require("../../common/decorators");
const user_entity_1 = require("./user.entity");
let UsersController = class UsersController {
    constructor(svc) {
        this.svc = svc;
    }
    getProfile(uid) {
        return this.svc.getProfile(uid);
    }
    updateProfile(uid, dto) {
        return this.svc.updateProfile(uid, dto);
    }
    getAddresses(uid) {
        return this.svc.getProfile(uid).then(u => u.addresses);
    }
    addAddress(uid, dto) {
        return this.svc.addAddress(uid, dto);
    }
    updateAddress(uid, aid, dto) {
        return this.svc.updateAddress(uid, aid, dto);
    }
    deleteAddress(uid, aid) {
        return this.svc.deleteAddress(uid, aid);
    }
    becomeSeller(uid, dto) {
        return this.svc.becomeSeller(uid, dto);
    }
    updateSellerProfile(uid, dto) {
        return this.svc.updateSellerProfile(uid, dto);
    }
    getPublicProfile(id) {
        return this.svc.findById(id);
    }
    listAll(page = 1, limit = 20, role, status, search) {
        return this.svc.listAll(+page, +limit, { role, status, search });
    }
    updateStatus(id, status) {
        return this.svc.updateStatus(id, status);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own profile' }),
    openapi.ApiResponse({ status: 200, type: require("./user.entity").User }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    openapi.ApiResponse({ status: 200, type: require("./user.entity").User }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('addresses'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAddresses", null);
__decorate([
    (0, common_1.Post)('addresses'),
    openapi.ApiResponse({ status: 201, type: require("./user.entity").User }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addAddress", null);
__decorate([
    (0, common_1.Patch)('addresses/:id'),
    openapi.ApiResponse({ status: 200, type: require("./user.entity").User }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateAddress", null);
__decorate([
    (0, common_1.Delete)('addresses/:id'),
    openapi.ApiResponse({ status: 200, type: require("./user.entity").User }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteAddress", null);
__decorate([
    (0, common_1.Post)('become-seller'),
    openapi.ApiResponse({ status: 201, type: require("./user.entity").User }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "becomeSeller", null);
__decorate([
    (0, common_1.Patch)('seller-profile'),
    openapi.ApiResponse({ status: 200, type: require("./user.entity").User }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateSellerProfile", null);
__decorate([
    (0, common_1.Get)('public/:id'),
    openapi.ApiResponse({ status: 200, type: require("./user.entity").User }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getPublicProfile", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Get)('admin/all'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listAll", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Patch)('admin/:id/status'),
    openapi.ApiResponse({ status: 200, type: require("./user.entity").User }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateStatus", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map