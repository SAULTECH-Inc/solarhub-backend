import {
  Controller, Post, Patch, Get, Param, Body, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { EscrowFeatureGuard } from './escrow-feature.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import {
  RegisterBankAccountDto, SellerRespondDto, FundEscrowDto,
  MarkShippedDto, RaiseDisputeDto, ResolveDisputeDto,
} from './escrow.dto';

@ApiTags('Escrow')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, EscrowFeatureGuard)
@Controller('escrow')
export class EscrowController {
  constructor(private readonly svc: EscrowService) {}

  // ── Bank account (sellers only) ───────────────────────────────────────────

  @Post('bank-account')
  @UseGuards(RolesGuard)
  @Roles('seller')
  @ApiOperation({ summary: 'Register a bank account for escrow payouts' })
  registerBankAccount(@Req() req: any, @Body() dto: RegisterBankAccountDto) {
    return this.svc.registerBankAccount(req.user.id, dto.bankCode, dto.accountNumber);
  }

  @Get('bank-account')
  @UseGuards(RolesGuard)
  @Roles('seller')
  @ApiOperation({ summary: 'List my bank accounts' })
  getBankAccounts(@Req() req: any) {
    return this.svc.getBankAccounts(req.user.id);
  }

  // ── Buyer: Initiate escrow ────────────────────────────────────────────────

  @Post('orders/:orderId/initiate')
  @UseGuards(RolesGuard)
  @Roles('buyer')
  @ApiOperation({ summary: 'Buyer initiates an escrow agreement for an order' })
  initiate(
    @Req() req: any,
    @Param('orderId') orderId: string,
    @Body('sellerId') sellerId: string,
    @Body('amount') amount: number,
    @Body('currency') currency: string,
  ) {
    return this.svc.initiate(orderId, req.user.id, sellerId, amount, currency);
  }

  // ── Seller: Respond to escrow request ────────────────────────────────────

  @Patch(':id/respond')
  @UseGuards(RolesGuard)
  @Roles('seller')
  @ApiOperation({ summary: 'Seller accepts or declines the escrow proposal' })
  sellerRespond(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SellerRespondDto,
  ) {
    return this.svc.sellerRespond(id, req.user.id, dto.decision, dto.reason);
  }

  // ── Buyer: Fund escrow ────────────────────────────────────────────────────

  @Post(':id/fund')
  @UseGuards(RolesGuard)
  @Roles('buyer')
  @ApiOperation({ summary: 'Buyer initiates payment to fund escrow (returns Paystack URL)' })
  fundEscrow(@Req() req: any, @Param('id') id: string, @Body() dto: FundEscrowDto) {
    return this.svc.initiateFunding(id, req.user.id, dto.email, dto.currency);
  }

  @Post('verify/:reference')
  @UseGuards(RolesGuard)
  @Roles('buyer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment and mark escrow as funded (call after Paystack redirect)' })
  verifyFunding(@Param('reference') reference: string) {
    return this.svc.confirmFunding(reference);
  }

  // ── Seller: Mark shipped ──────────────────────────────────────────────────

  @Patch(':id/mark-shipped')
  @UseGuards(RolesGuard)
  @Roles('seller')
  @ApiOperation({ summary: 'Seller confirms goods have been shipped' })
  markShipped(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: MarkShippedDto,
  ) {
    return this.svc.markShipped(id, req.user.id, dto);
  }

  // ── Buyer: Confirm delivery / raise dispute ───────────────────────────────

  @Patch(':id/confirm-delivery')
  @UseGuards(RolesGuard)
  @Roles('buyer')
  @ApiOperation({ summary: 'Buyer confirms receipt and satisfaction — releases funds to seller' })
  confirmDelivery(@Req() req: any, @Param('id') id: string) {
    return this.svc.confirmDelivery(id, req.user.id);
  }

  @Post(':id/dispute')
  @UseGuards(RolesGuard)
  @Roles('buyer')
  @ApiOperation({ summary: 'Buyer raises a dispute — funds are held pending admin review' })
  raiseDispute(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RaiseDisputeDto,
  ) {
    return this.svc.raiseDispute(id, req.user.id, dto.reason, dto.evidence);
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get escrow details for an order' })
  getByOrder(@Param('orderId') orderId: string) {
    return this.svc.findByOrder(orderId);
  }

  @Get('me/buying')
  @UseGuards(RolesGuard)
  @Roles('buyer')
  @ApiOperation({ summary: 'List my escrows as buyer' })
  myBuyerEscrows(@Req() req: any, @Query('page') p = 1, @Query('limit') l = 20) {
    return this.svc.listForBuyer(req.user.id, +p, +l);
  }

  @Get('me/selling')
  @UseGuards(RolesGuard)
  @Roles('seller')
  @ApiOperation({ summary: 'List my escrows as seller' })
  mySellerEscrows(@Req() req: any, @Query('page') p = 1, @Query('limit') l = 20) {
    return this.svc.listForSeller(req.user.id, +p, +l);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single escrow by ID' })
  getOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] List all escrow transactions' })
  listAll(
    @Query('page') p = 1,
    @Query('limit') l = 20,
    @Query('status') status?: string,
  ) {
    return this.svc.listAll(+p, +l, status);
  }

  @Patch(':id/resolve-dispute')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Resolve a disputed escrow' })
  resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.svc.resolveDispute(id, dto.decision, dto.note);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Cancel an escrow (before funds have been released)' })
  adminCancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.svc.adminCancel(id, reason);
  }
}
