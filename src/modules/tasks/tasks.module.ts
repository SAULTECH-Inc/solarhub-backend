import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../redis/redis.module';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotificationsModule,
    RedisModule,
    EscrowModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
