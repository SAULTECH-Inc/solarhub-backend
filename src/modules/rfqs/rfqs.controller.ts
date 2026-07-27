import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RfqsService } from './rfqs.service';
import { JwtAuthGuard }  from '../../common/guards/jwt-auth.guard';
import { RolesGuard }    from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
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

  // ── Admin ─────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/all')
  @ApiOperation({ summary: 'List all RFQs (admin)' })
  adminListAll(@Query('page') p = 1, @Query('limit') l = 20, @Query('status') status?: string) {
    return this.svc.adminListAll(+p, +l, status);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('admin/:id/cancel')
  @ApiOperation({ summary: 'Cancel an RFQ (admin)' })
  adminCancel(@Param('id') id: string) {
    return this.svc.adminCancelRfq(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/:id/bids')
  @ApiOperation({ summary: 'Get all bids for an RFQ (admin)' })
  adminGetBids(@Param('id') rfqId: string) {
    return this.svc.adminGetRfqBids(rfqId);
  }
}
