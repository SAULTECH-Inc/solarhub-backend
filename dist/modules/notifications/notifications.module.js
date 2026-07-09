"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const handlebars_adapter_1 = require("@nestjs-modules/mailer/dist/adapters/handlebars.adapter");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
const typeorm_1 = require("@nestjs/typeorm");
const notifications_service_1 = require("./notifications.service");
const email_processor_1 = require("./email.processor");
const notifications_controller_1 = require("./notifications.controller");
const notification_entity_1 = require("./notification.entity");
const push_token_entity_1 = require("./push-token.entity");
const firebase_admin_service_1 = require("./firebase-admin.service");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([notification_entity_1.Notification, push_token_entity_1.PushToken]),
            mailer_1.MailerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    transport: {
                        host: cfg.get('email.host'),
                        port: cfg.get('email.port'),
                        secure: cfg.get('email.port') === 465,
                        auth: { user: cfg.get('email.user'), pass: cfg.get('email.pass') },
                    },
                    defaults: {
                        from: `"${cfg.get('email.fromName')}" <${cfg.get('email.fromEmail')}>`,
                    },
                    template: {
                        dir: (0, path_1.join)(__dirname, 'templates'),
                        adapter: new handlebars_adapter_1.HandlebarsAdapter(),
                        options: { strict: true },
                    },
                }),
            }),
            bull_1.BullModule.registerQueue({ name: 'email' }),
        ],
        providers: [notifications_service_1.NotificationsService, email_processor_1.EmailProcessor, firebase_admin_service_1.FirebaseAdminService],
        controllers: [notifications_controller_1.NotificationsController],
        exports: [notifications_service_1.NotificationsService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map