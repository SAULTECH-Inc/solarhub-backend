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
exports.FavouritesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const favourites_service_1 = require("./favourites.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const decorators_1 = require("../../common/decorators");
let FavouritesController = class FavouritesController {
    constructor(svc) {
        this.svc = svc;
    }
    getAll(uid, p = 1, l = 20) {
        return this.svc.getUserFavourites(uid, +p, +l);
    }
    getIds(uid) {
        return this.svc.getUserFavouriteIds(uid);
    }
    toggle(uid, pid) {
        return this.svc.toggle(uid, pid);
    }
    check(uid, pid) {
        return this.svc.isFavourited(uid, pid).then(is => ({ isFavourited: is }));
    }
    clearAll(uid) {
        return this.svc.clearAll(uid);
    }
};
exports.FavouritesController = FavouritesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user saved products' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], FavouritesController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('ids'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all favourite product IDs (for UI state)' }),
    openapi.ApiResponse({ status: 200, type: [String] }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FavouritesController.prototype, "getIds", null);
__decorate([
    (0, common_1.Post)(':productId'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle a product favourite (add or remove)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FavouritesController.prototype, "toggle", null);
__decorate([
    (0, common_1.Get)(':productId/check'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FavouritesController.prototype, "check", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all favourites' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FavouritesController.prototype, "clearAll", null);
exports.FavouritesController = FavouritesController = __decorate([
    (0, swagger_1.ApiTags)('Favourites'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('favourites'),
    __metadata("design:paramtypes", [favourites_service_1.FavouritesService])
], FavouritesController);
//# sourceMappingURL=favourites.controller.js.map