import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User]), RedisModule],
  providers: [UploadsService, UsersService],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}
