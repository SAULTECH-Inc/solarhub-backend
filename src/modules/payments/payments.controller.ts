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
  @ApiOperation({ summary: 'Initiate payment — routes to Flutterwave (African), Paddle (international), or Stripe (CNY)' })
  initiatePayment(
    @CurrentUser() user: any,
    @Body() body: { orderId: string; currency: string; method?: string; customerName?: string },
  ) {
    return this.svc.initiatePayment(
      body.orderId, user.id, body.currency, user.email, body.method, body.customerName,
    );
  }

  // ── Verify ────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('verify/paystack/:reference')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verify a Paystack payment' })
  verifyPaystack(@Param('reference') ref: string) {
    return this.svc.verifyPaystack(ref);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/flutterwave')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verify a Flutterwave payment' })
  verifyFlutterwave(
    @Query('txId') txId: string,
    @Query('txRef') txRef: string,
  ) {
    return this.svc.verifyFlutterwave(txId, txRef);
  }

  // ── Order / Refund ────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  @ApiBearerAuth('JWT')
  getOrderPayments(@Param('orderId') id: string) {
    return this.svc.getPaymentByOrder(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/refund')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Refund a payment' })
  refund(
    @Param('id') id: string,
    @Body('amount') amount?: number,
    @Body('reason') reason?: string,
  ) {
    return this.svc.refund(id, amount, reason);
  }

  // ── Webhooks (no auth — signature verified internally) ────────────────────

  @Public()
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook' })
  paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') sig: string,
  ) {
    return this.svc.handlePaystackWebhook(req.rawBody, sig);
  }

  @Public()
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook' })
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.svc.handleStripeWebhook(req.rawBody, sig);
  }

  @Public()
  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave webhook' })
  flutterwaveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('verif-hash') sig: string,
  ) {
    return this.svc.handleFlutterwaveWebhook(req.rawBody, sig);
  }

  @Public()
  @Post('webhook/paddle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paddle webhook' })
  paddleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('paddle-signature') sig: string,
  ) {
    return this.svc.handlePaddleWebhook(req.rawBody, sig);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/stats')
  getStats() { return this.svc.getStats(); }
}
