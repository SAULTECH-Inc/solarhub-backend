import {
  Controller, Post, Get, Body, Param, Query,
  UseGuards, Req, Headers, RawBodyRequest, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Public, Roles } from '../../common/decorators';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Initiate a payment (Paystack for NGN/USD/GHS, Stripe for USD/CNY)' })
  initiatePayment(
    @CurrentUser() user: any,
    @Body() body: { orderId: string; currency: string; method?: string },
  ) {
    return this.svc.initiatePayment(body.orderId, user.id, body.currency, user.email, body.method);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/paystack/:reference')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verify a Paystack payment' })
  verifyPaystack(@Param('reference') ref: string) {
    return this.svc.verifyPaystack(ref);
  }

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  @ApiBearerAuth('JWT')
  getOrderPayments(@Param('orderId') id: string) {
    return this.svc.getPaymentByOrder(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/refund')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Refund a payment (admin / seller)' })
  refund(
    @Param('id') id: string,
    @Body('amount') amount?: number,
    @Body('reason') reason?: string,
  ) {
    return this.svc.refund(id, amount, reason);
  }

  // ── Webhooks (no auth — signature verified internally) ────
  @Public()
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') sig: string,
  ) {
    return this.svc.handlePaystackWebhook(req.rawBody, sig);
  }

  @Public()
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.svc.handleStripeWebhook(req.rawBody, sig);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/stats')
  getStats() { return this.svc.getStats(); }
}
