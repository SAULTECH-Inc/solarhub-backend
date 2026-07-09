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
exports.EscrowFeatureGuard = void 0;
const common_1 = require("@nestjs/common");
const platform_settings_service_1 = require("../platform-settings/platform-settings.service");
let EscrowFeatureGuard = class EscrowFeatureGuard {
    constructor(settings) {
        this.settings = settings;
    }
    async canActivate(ctx) {
        const enabled = await this.settings.getBoolean('escrow_enabled');
        if (!enabled) {
            throw new common_1.ServiceUnavailableException('Escrow is currently unavailable on this platform');
        }
        return true;
    }
};
exports.EscrowFeatureGuard = EscrowFeatureGuard;
exports.EscrowFeatureGuard = EscrowFeatureGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [platform_settings_service_1.PlatformSettingsService])
], EscrowFeatureGuard);
//# sourceMappingURL=escrow-feature.guard.js.map