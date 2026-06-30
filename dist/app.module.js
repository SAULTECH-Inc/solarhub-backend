"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const app_config_1 = require("./config/app.config");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const products_module_1 = require("./modules/products/products.module");
const categories_module_1 = require("./modules/categories/categories.module");
const cart_module_1 = require("./modules/cart/cart.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const delivery_module_1 = require("./modules/delivery/delivery.module");
const chat_module_1 = require("./modules/chat/chat.module");
const advisor_module_1 = require("./modules/advisor/advisor.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const favourites_module_1 = require("./modules/favourites/favourites.module");
const admin_module_1 = require("./modules/admin/admin.module");
const redis_module_1 = require("./modules/redis/redis.module");
const engineers_module_1 = require("./modules/engineers/engineers.module");
const rfqs_module_1 = require("./modules/rfqs/rfqs.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const logistics_module_1 = require("./modules/logistics/logistics.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                load: [
                    app_config_1.appConfig, app_config_1.dbConfig, app_config_1.redisConfig, app_config_1.jwtConfig,
                    app_config_1.googleConfig, app_config_1.anthropicConfig, app_config_1.openaiConfig,
                    app_config_1.emailConfig, app_config_1.paystackConfig, app_config_1.stripeConfig,
                    app_config_1.flutterwaveConfig, app_config_1.paddleConfig,
                    app_config_1.cloudinaryConfig, app_config_1.throttleConfig, app_config_1.firebaseConfig,
                ],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    type: 'postgres',
                    host: cfg.get('database.host'),
                    port: cfg.get('database.port'),
                    username: cfg.get('database.username'),
                    password: cfg.get('database.password'),
                    database: cfg.get('database.database'),
                    entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
                    migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
                    synchronize: cfg.get('database.sync', false),
                    logging: cfg.get('database.logging', false),
                    migrationsRun: false,
                    ssl: cfg.get('app.nodeEnv') === 'production'
                        ? { rejectUnauthorized: false }
                        : false,
                    extra: { max: 20 },
                }),
            }),
            bull_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    redis: {
                        host: cfg.get('redis.host'),
                        port: cfg.get('redis.port'),
                        password: cfg.get('redis.password') || undefined,
                    },
                    defaultJobOptions: {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 5000 },
                        removeOnComplete: 100,
                        removeOnFail: 50,
                    },
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    throttlers: [{
                            ttl: cfg.get('throttle.ttl', 60) * 1000,
                            limit: cfg.get('throttle.limit', 100),
                        }],
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            cart_module_1.CartModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            delivery_module_1.DeliveryModule,
            chat_module_1.ChatModule,
            advisor_module_1.AdvisorModule,
            notifications_module_1.NotificationsModule,
            uploads_module_1.UploadsModule,
            reviews_module_1.ReviewsModule,
            favourites_module_1.FavouritesModule,
            admin_module_1.AdminModule,
            engineers_module_1.EngineersModule,
            rfqs_module_1.RfqsModule,
            subscriptions_module_1.SubscriptionsModule,
            logistics_module_1.LogisticsModule,
            tasks_module_1.TasksModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map