import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rfq, RfqBid } from './rfq.entity';
import { RfqsService } from './rfqs.service';
import { RfqsController } from './rfqs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rfq, RfqBid])],
  controllers: [RfqsController],
  providers: [RfqsService],
  exports: [RfqsService],
})
export class RfqsModule {}
