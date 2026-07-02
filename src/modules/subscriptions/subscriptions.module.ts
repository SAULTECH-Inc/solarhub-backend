import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionInvoice } from './subscription-invoice.entity';
import { User } from '../users/user.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SubscriptionInvoice, User]),
    RedisModule,
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
