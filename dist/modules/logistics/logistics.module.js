"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const logistics_entity_1 = require("./logistics.entity");
const logistics_service_1 = require("./logistics.service");
const logistics_controller_1 = require("./logistics.controller");
const delivery_entity_1 = require("../delivery/delivery.entity");
const user_entity_1 = require("../users/user.entity");
const notifications_module_1 = require("../notifications/notifications.module");
let LogisticsModule = class LogisticsModule {
};
exports.LogisticsModule = LogisticsModule;
exports.LogisticsModule = LogisticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                logistics_entity_1.LogisticsProvider,
                logistics_entity_1.LogisticsAgent,
                logistics_entity_1.ShipmentAssignment,
                delivery_entity_1.DeliveryTracking,
                user_entity_1.User,
            ]),
            notifications_module_1.NotificationsModule,
        ],
        providers: [logistics_service_1.LogisticsService],
        controllers: [logistics_controller_1.LogisticsController],
        exports: [logistics_service_1.LogisticsService],
    })
], LogisticsModule);
//# sourceMappingURL=logistics.module.js.map