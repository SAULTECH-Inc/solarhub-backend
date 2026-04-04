import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Engineer } from './engineer.entity';
import { User } from '../users/user.entity';
import { EngineersService } from './engineers.service';
import { EngineersController } from './engineers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Engineer, User])],
  providers: [EngineersService],
  controllers: [EngineersController],
  exports: [EngineersService],
})
export class EngineersModule {}
