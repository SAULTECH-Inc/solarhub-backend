"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const engineer_entity_1 = require("./engineer.entity");
const user_entity_1 = require("../users/user.entity");
const engineers_service_1 = require("./engineers.service");
const engineers_controller_1 = require("./engineers.controller");
let EngineersModule = class EngineersModule {
};
exports.EngineersModule = EngineersModule;
exports.EngineersModule = EngineersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([engineer_entity_1.Engineer, user_entity_1.User])],
        providers: [engineers_service_1.EngineersService],
        controllers: [engineers_controller_1.EngineersController],
        exports: [engineers_service_1.EngineersService],
    })
], EngineersModule);
//# sourceMappingURL=engineers.module.js.map