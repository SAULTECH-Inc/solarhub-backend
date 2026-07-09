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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const redis_service_1 = require("../redis/redis.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
const REMINDER_COOLDOWN_S = 48 * 60 * 60;
const MIN_AGE_H = 24;
const MAX_AGE_D = 7;
let TasksService = TasksService_1 = class TasksService {
    constructor(userRepo, notif, redis) {
        this.userRepo = userRepo;
        this.notif = notif;
        this.redis = redis;
        this.logger = new common_1.Logger(TasksService_1.name);
    }
    async scheduledReminder() {
        this.logger.log('Scheduled: remindUnverifiedUsers starting');
        await this.remindUnverifiedUsers();
    }
    async remindUnverifiedUsers() {
        const now = new Date();
        const minAge = new Date(now.getTime() - MIN_AGE_H * 60 * 60 * 1000);
        const maxAge = new Date(now.getTime() - MAX_AGE_D * 24 * 60 * 60 * 1000);
        const users = await this.userRepo.find({
            where: {
                emailVerified: false,
                status: user_entity_1.UserStatus.PENDING,
                createdAt: (0, typeorm_2.Between)(maxAge, minAge),
            },
            select: ['id', 'email', 'firstName', 'createdAt'],
            take: 200,
        });
        let reminded = 0;
        let skipped = 0;
        for (const user of users) {
            const cooldownKey = `reminder:unverified:${user.id}`;
            const alreadySent = await this.redis.get(cooldownKey);
            if (alreadySent) {
                skipped++;
                continue;
            }
            try {
                const otp = (0, pagination_util_1.generateOtp)();
                await this.redis.setOtp(user.email, otp, 600);
                await this.notif.sendVerificationReminder(user, otp);
                await this.redis.set(cooldownKey, '1', REMINDER_COOLDOWN_S);
                reminded++;
                this.logger.log(`Reminder sent to ${user.email}`);
            }
            catch (e) {
                this.logger.warn(`Failed to remind ${user.email}: ${e.message}`);
                skipped++;
            }
        }
        this.logger.log(`remindUnverifiedUsers done — reminded: ${reminded}, skipped: ${skipped}`);
        return { reminded, skipped };
    }
};
exports.TasksService = TasksService;
__decorate([
    (0, schedule_1.Cron)('0 10 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "scheduledReminder", null);
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        redis_service_1.RedisService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map