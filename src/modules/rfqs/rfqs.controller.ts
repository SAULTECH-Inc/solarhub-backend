import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RfqsService } from './rfqs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/user.entity';

@ApiTags('RFQs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('rfqs')
export class RfqsController {
  constructor(private readonly svc: RfqsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RFQ (Buyer)' })
  createRfq(@CurrentUser('id') uid: string, @Body() dto: any) {
    return this.svc.createRfq(uid, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get buyer RFQs' })
  getMyRfqs(@CurrentUser('id') uid: string, @Query('page') p = 1, @Query('limit') l = 20) {
    return this.svc.getMyRfqs(uid, +p, +l);
  }

  @Patch('bids/:id/accept')
  @ApiOperation({ summary: 'Accept a bid (Buyer)' })
  acceptBid(@CurrentUser('id') uid: string, @Param('id') bidId: string) {
    return this.svc.acceptBid(uid, bidId);
  }

  @Get('board')
  @ApiOperation({ summary: 'Job Board - Get open RFQs (Contractor)' })
  getOpenRfqs(@Query('state') state?: string, @Query('city') city?: string, @Query('page') p = 1, @Query('limit') l = 20) {
    return this.svc.getOpenRfqs(state, city, +p, +l);
  }

  @Post(':id/bids')
  @ApiOperation({ summary: 'Submit a bid to an RFQ (Contractor)' })
  submitBid(@CurrentUser() user: User, @Param('id') rfqId: string, @Body() dto: any) {
    return this.svc.submitBid(user, rfqId, dto);
  }
}
