import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsProvider, LogisticsAgent, ShipmentAssignment } from './logistics.entity';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { DeliveryTracking } from '../delivery/delivery.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LogisticsProvider,
      LogisticsAgent,
      ShipmentAssignment,
      DeliveryTracking,
      User,
    ]),
    NotificationsModule,
  ],
  providers: [LogisticsService],
  controllers: [LogisticsController],
  exports: [LogisticsService],
})
export class LogisticsModule {}
