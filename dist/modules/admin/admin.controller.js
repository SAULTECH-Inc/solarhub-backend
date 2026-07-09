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
exports.AdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const users_service_1 = require("../users/users.service");
const products_service_1 = require("../products/products.service");
const orders_service_1 = require("../orders/orders.service");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const decorators_1 = require("../../common/decorators");
const user_entity_1 = require("../users/user.entity");
let AdminController = class AdminController {
    constructor(svc, users, products, orders, platformSettings) {
        this.svc = svc;
        this.users = users;
        this.products = products;
        this.orders = orders;
        this.platformSettings = platformSettings;
    }
    seedSuperAdmin(key, email, password) {
        return this.svc.seedSuperAdmin(key, email, password);
    }
    getDashboard() { return this.svc.getDashboard(); }
    getHealth() { return this.svc.getSystemHealth(); }
    globalSearch(q) { return this.svc.globalSearch(q); }
    getAnalytics(days = 30) {
        return this.svc.getAnalytics(+days);
    }
    getPaymentDetail(id) { return this.svc.getPaymentDetail(id); }
    listUsers(p = 1, l = 20, role, status, search) {
        return this.users.listAll(+p, +l, { role, status, search });
    }
    updateUserStatus(id, status) {
        return this.users.updateStatus(id, status);
    }
    verifySeller(id, approved) {
        return this.svc.verifySeller(id, approved);
    }
    userStats() { return this.users.getStats(); }
    getUserDetail(id) {
        return this.svc.getUserDetail(id);
    }
    getPendingProducts() { return this.svc.getPendingProducts(); }
    moderate(id, action, reason) {
        return this.svc.moderateProduct(id, action, reason);
    }
    setFeatured(id, featured, badge) {
        return this.svc.setFeatured(id, featured, badge);
    }
    productStats() { return this.products.getStats(); }
    listOrders(p = 1, l = 20, status, search, paymentStatus) {
        return this.orders.getAllOrders(+p, +l, status, search, paymentStatus);
    }
    advanceOrder(id, note) {
        return this.orders.advanceStatus(id, 'admin', 'admin', note);
    }
    orderStats() { return this.orders.getOrderStats(); }
    getOrderDetail(id) {
        return this.svc.getOrderDetail(id);
    }
    getSettings() { return this.platformSettings.getAll(); }
    updateSetting(key, value) {
        return this.platformSettings.set(key, value);
    }
    getFlaggedUsers(p = 1, l = 20) {
        return this.svc.getFlaggedUsers(+p, +l);
    }
    flagUser(id, reason) {
        return this.svc.flagUser(id, reason);
    }
    unflagUser(id) {
        return this.svc.unflagUser(id);
    }
    getRiskyPayments(p = 1, l = 20) {
        return this.svc.getRiskyPayments(+p, +l);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('seed'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Promote or create a super-admin account (requires ADMIN_SEED_KEY header)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Headers)('x-seed-key')),
    __param(1, (0, common_1.Body)('email')),
    __param(2, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "seedSuperAdmin", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin dashboard stats' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'System health check' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('search'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "globalSearch", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Platform analytics for N days' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('payments/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPaymentDetail", null);
__decorate([
    (0, common_1.Get)('users'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id/status'),
    openapi.ApiResponse({ status: 200, type: require("../users/user.entity").User }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Patch)('users/:id/verify-seller'),
    openapi.ApiResponse({ status: 200, type: require("../users/user.entity").User }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('approved')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "verifySeller", null);
__decorate([
    (0, common_1.Get)('users/stats'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "userStats", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUserDetail", null);
__decorate([
    (0, common_1.Get)('products/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Products awaiting approval' }),
    openapi.ApiResponse({ status: 200, type: [require("../products/product.entity").Product] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPendingProducts", null);
__decorate([
    (0, common_1.Patch)('products/:id/moderate'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject a product listing' }),
    openapi.ApiResponse({ status: 200, type: require("../products/product.entity").Product }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('action')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "moderate", null);
__decorate([
    (0, common_1.Patch)('products/:id/feature'),
    (0, swagger_1.ApiOperation)({ summary: 'Feature or unfeature a product' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('featured')),
    __param(2, (0, common_1.Body)('badge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setFeatured", null);
__decorate([
    (0, common_1.Get)('products/stats'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "productStats", null);
__decorate([
    (0, common_1.Get)('orders'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('paymentStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Patch)('orders/:id/advance'),
    openapi.ApiResponse({ status: 200, type: require("../orders/order.entity").Order }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('note')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "advanceOrder", null);
__decorate([
    (0, common_1.Get)('orders/stats'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "orderStats", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOrderDetail", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'List all platform settings (feature flags, config)' }),
    openapi.ApiResponse({ status: 200, type: [require("../platform-settings/platform-setting.entity").PlatformSetting] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a platform setting — e.g. toggle escrow on/off' }),
    openapi.ApiResponse({ status: 200, type: require("../platform-settings/platform-setting.entity").PlatformSetting }),
    __param(0, (0, common_1.Body)('key')),
    __param(1, (0, common_1.Body)('value')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateSetting", null);
__decorate([
    (0, common_1.Get)('fraud/flagged'),
    (0, swagger_1.ApiOperation)({ summary: 'List flagged users' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getFlaggedUsers", null);
__decorate([
    (0, common_1.Patch)('fraud/flag/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Flag a user for fraud' }),
    openapi.ApiResponse({ status: 200, type: require("../users/user.entity").User }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "flagUser", null);
__decorate([
    (0, common_1.Patch)('fraud/unflag/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear a fraud flag from a user' }),
    openapi.ApiResponse({ status: 200, type: require("../users/user.entity").User }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "unflagUser", null);
__decorate([
    (0, common_1.Get)('fraud/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'List high-risk or disputed payments' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRiskyPayments", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        users_service_1.UsersService,
        products_service_1.ProductsService,
        orders_service_1.OrdersService,
        platform_settings_service_1.PlatformSettingsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map