import {
  Controller, Post, Get, Body, Param,
  UseGuards, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly svc: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans with pricing' })
  getPlans() {
    return this.svc.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Initiate a subscription payment' })
  subscribe(
    @CurrentUser() user: any,
    @Body('plan') plan: string,
    @Body('currency') currency = 'NGN',
  ) {
    return this.svc.subscribe(user, plan, currency);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/paystack/:reference')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Manually verify a Paystack subscription payment' })
  verifyPaystack(@Param('reference') reference: string) {
    return this.svc.verifyPaystackReference(reference);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Cancel active subscription' })
  cancel(@CurrentUser('id') userId: string) {
    return this.svc.cancelSubscription(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get subscription invoice history' })
  getInvoices(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.svc.getInvoices(userId, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices/:id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get a single subscription invoice' })
  getInvoice(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.getInvoiceById(id, userId);
  }
}
