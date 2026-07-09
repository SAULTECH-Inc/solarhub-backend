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
exports.PublicController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../../common/decorators");
const platform_settings_service_1 = require("./platform-settings.service");
let PublicController = class PublicController {
    constructor(svc) {
        this.svc = svc;
    }
    async getPublicSettings() {
        const all = await this.svc.getAll();
        return Object.fromEntries(all.map(s => [s.key, s.value]));
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Public platform settings (feature flags visible to UI)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getPublicSettings", null);
exports.PublicController = PublicController = __decorate([
    (0, swagger_1.ApiTags)('Platform'),
    (0, common_1.Controller)('platform'),
    __metadata("design:paramtypes", [platform_settings_service_1.PlatformSettingsService])
], PublicController);
//# sourceMappingURL=public.controller.js.map