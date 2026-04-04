import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import {
  appConfig, dbConfig, redisConfig, jwtConfig,
  googleConfig, anthropicConfig, openaiConfig,
  emailConfig, paystackConfig, stripeConfig,
  cloudinaryConfig, throttleConfig,
} from '@config/app.config';

import { AuthModule }          from '@modules/auth/auth.module';
import { UsersModule }         from '@modules/users/users.module';
import { ProductsModule }      from '@modules/products/products.module';
import { CategoriesModule }    from '@modules/categories/categories.module';
import { CartModule }          from '@modules/cart/cart.module';
import { OrdersModule }        from '@modules/orders/orders.module';
import { PaymentsModule }      from '@modules/payments/payments.module';
import { DeliveryModule }      from '@modules/delivery/delivery.module';
import { ChatModule }          from '@modules/chat/chat.module';
import { AdvisorModule }       from '@modules/advisor/advisor.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { UploadsModule }       from '@modules/uploads/uploads.module';
import { ReviewsModule }       from '@modules/reviews/reviews.module';
import { FavouritesModule }    from '@modules/favourites/favourites.module';
import { AdminModule }         from '@modules/admin/admin.module';
import { RedisModule }         from '@modules/redis/redis.module';
import { EngineersModule }     from '@modules/engineers/engineers.module';
import { RfqsModule }          from '@modules/rfqs/rfqs.module';

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        appConfig, dbConfig, redisConfig, jwtConfig,
        googleConfig, anthropicConfig, openaiConfig,
        emailConfig, paystackConfig, stripeConfig,
        cloudinaryConfig, throttleConfig,
      ],
    }),

    // ── Database ──────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host:     cfg.get('database.host'),
        port:     cfg.get<number>('database.port'),
        username: cfg.get('database.username'),
        password: cfg.get('database.password'),
        database: cfg.get('database.database'),
        entities:  [__dirname + '/modules/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: cfg.get<boolean>('database.sync', false),
        logging:     cfg.get<boolean>('database.logging', false),
        migrationsRun: false,
        ssl: cfg.get('app.nodeEnv') === 'production'
          ? { rejectUnauthorized: false }
          : false,
        extra: { max: 20 },         // connection pool
      }),
    }),

    // ── Redis / Bull Queue ─────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        redis: {
          host:     cfg.get('redis.host'),
          port:     cfg.get<number>('redis.port'),
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

    // ── Throttler (rate limiting) ─────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        throttlers: [{
          ttl:   cfg.get<number>('throttle.ttl', 60) * 1000,
          limit: cfg.get<number>('throttle.limit', 100),
        }],
      }),
    }),

    // ── Scheduler ─────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Feature Modules ───────────────────────────────────────
    RedisModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    DeliveryModule,
    ChatModule,
    AdvisorModule,
    NotificationsModule,
    UploadsModule,
    ReviewsModule,
    FavouritesModule,
    AdminModule,
    EngineersModule,
    RfqsModule,
  ],
  providers: [
    // Global rate-limit guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
