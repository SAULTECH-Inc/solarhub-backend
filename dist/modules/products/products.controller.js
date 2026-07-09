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
exports.ProductsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const products_service_1 = require("./products.service");
const uploads_service_1 = require("../uploads/uploads.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const decorators_1 = require("../../common/decorators");
let ProductsController = class ProductsController {
    constructor(svc, uploads) {
        this.svc = svc;
        this.uploads = uploads;
    }
    search(page = 1, limit = 20, search, category, minPrice, maxPrice, city, state, condition, featured) {
        return this.svc.search({ search, category, minPrice, maxPrice, city, state, condition, featured }, +page, +limit);
    }
    getFeatured(limit = 12) {
        return this.svc.getFeatured(+limit);
    }
    findOne(idOrSlug) {
        const isUuid = /^[0-9a-f-]{36}$/.test(idOrSlug);
        return isUuid
            ? this.svc.findById(idOrSlug, true)
            : this.svc.findBySlug(idOrSlug);
    }
    create(dto, user) {
        return this.svc.create(dto, user);
    }
    update(id, dto, user) {
        return this.svc.update(id, dto, user.id, user.role);
    }
    delete(id, user) {
        return this.svc.delete(id, user.id, user.role);
    }
    async uploadImage(id, file, user) {
        const product = await this.svc.findById(id);
        if (product.sellerId !== user.id && user.role !== 'admin')
            throw new Error('Forbidden');
        const result = await this.uploads.uploadImage(file, 'products');
        const images = [...(product.images || []), result.url];
        return this.svc.update(id, { images, thumbnail: product.thumbnail || result.url }, user.id, user.role);
    }
    async scanLabel(file, category) {
        return this.uploads.extractSpecsFromLabel(file, category);
    }
    getEditLock(productId, user) {
        return this.svc.getEditLockStatus(productId);
    }
    getMyProducts(uid, page = 1, limit = 20) {
        return this.svc.getSellerProducts(uid, +page, +limit);
    }
    getListingQuota(user) {
        return this.svc.getListingQuota(user);
    }
    approve(id) {
        return this.svc.approve(id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search/filter products' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'minPrice', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'maxPrice', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'condition', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('minPrice')),
    __param(5, (0, common_1.Query)('maxPrice')),
    __param(6, (0, common_1.Query)('city')),
    __param(7, (0, common_1.Query)('state')),
    __param(8, (0, common_1.Query)('condition')),
    __param(9, (0, common_1.Query)('featured')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, Number, Number, String, String, String, Boolean]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "search", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('featured'),
    openapi.ApiResponse({ status: 200, type: [require("./product.entity").Product] }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getFeatured", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':idOrSlug'),
    openapi.ApiResponse({ status: 200, type: require("./product.entity").Product }),
    __param(0, (0, common_1.Param)('idOrSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a product listing (sellers only)' }),
    openapi.ApiResponse({ status: 201, type: require("./product.entity").Product }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    openapi.ApiResponse({ status: 200, type: require("./product.entity").Product }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "delete", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/upload-image'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    openapi.ApiResponse({ status: 201, type: require("./product.entity").Product }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('scan-label'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "scanLabel", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('seller/edit-lock/:productId'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if a product is locked for editing' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getEditLock", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('seller/my-products'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getMyProducts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('seller/listing-quota'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current seller listing quota usage' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getListingQuota", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Patch)(':id/approve'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    openapi.ApiResponse({ status: 200, type: require("./product.entity").Product }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "approve", null);
exports.ProductsController = ProductsController = __decorate([
    (0, swagger_1.ApiTags)('Products'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        uploads_service_1.UploadsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map