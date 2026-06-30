// advisor.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisorService } from './advisor.service';
import { AdvisorController } from './advisor.controller';
import { AdvisorSession } from './advisor.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AdvisorSession, Product])],
  providers: [AdvisorService],
  controllers: [AdvisorController],
  exports: [AdvisorService],
})
export class AdvisorModule {}
