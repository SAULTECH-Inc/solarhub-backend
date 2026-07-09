"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const escrow_entity_1 = require("./escrow.entity");
const seller_bank_account_entity_1 = require("./seller-bank-account.entity");
const escrow_service_1 = require("./escrow.service");
const escrow_controller_1 = require("./escrow.controller");
const escrow_feature_guard_1 = require("./escrow-feature.guard");
const platform_settings_module_1 = require("../platform-settings/platform-settings.module");
const notifications_module_1 = require("../notifications/notifications.module");
let EscrowModule = class EscrowModule {
};
exports.EscrowModule = EscrowModule;
exports.EscrowModule = EscrowModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([escrow_entity_1.EscrowTransaction, seller_bank_account_entity_1.SellerBankAccount]),
            platform_settings_module_1.PlatformSettingsModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [escrow_service_1.EscrowService, escrow_feature_guard_1.EscrowFeatureGuard],
        controllers: [escrow_controller_1.EscrowController],
        exports: [escrow_service_1.EscrowService],
    })
], EscrowModule);
//# sourceMappingURL=escrow.module.js.map