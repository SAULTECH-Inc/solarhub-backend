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
var TasksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../../common/decorators");
const tasks_service_1 = require("./tasks.service");
let TasksController = TasksController_1 = class TasksController {
    constructor(svc, cfg) {
        this.svc = svc;
        this.cfg = cfg;
        this.logger = new common_1.Logger(TasksController_1.name);
    }
    async cronRemindUnverified(auth) {
        const secret = this.cfg.get('app.cronSecret');
        if (secret) {
            const provided = auth?.replace(/^Bearer\s+/i, '');
            if (provided !== secret)
                throw new common_1.UnauthorizedException('Invalid cron secret');
        }
        this.logger.log('Cron endpoint triggered: remind-unverified');
        return this.svc.remindUnverifiedUsers();
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('cron/remind-unverified'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger unverified-account reminder job (cron endpoint)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "cronRemindUnverified", null);
exports.TasksController = TasksController = TasksController_1 = __decorate([
    (0, swagger_1.ApiTags)('Tasks'),
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService,
        config_1.ConfigService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map