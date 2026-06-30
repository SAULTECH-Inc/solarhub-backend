"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvisorModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const advisor_service_1 = require("./advisor.service");
const advisor_controller_1 = require("./advisor.controller");
const advisor_entity_1 = require("./advisor.entity");
const product_entity_1 = require("../products/product.entity");
let AdvisorModule = class AdvisorModule {
};
exports.AdvisorModule = AdvisorModule;
exports.AdvisorModule = AdvisorModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, typeorm_1.TypeOrmModule.forFeature([advisor_entity_1.AdvisorSession, product_entity_1.Product])],
        providers: [advisor_service_1.AdvisorService],
        controllers: [advisor_controller_1.AdvisorController],
        exports: [advisor_service_1.AdvisorService],
    })
], AdvisorModule);
//# sourceMappingURL=advisor.module.js.map