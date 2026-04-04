import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { OrderStatus } from './order.entity';

@ApiTags('Orders')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place an order from current cart' })
  placeOrder(@CurrentUser() user: any, @Body() dto: any) {
    return this.svc.placeOrder(user.id, dto, user);
  }

  @Get('my')
  getMyOrders(
    @CurrentUser('id') uid: string,
    @Query('page') page = 1, @Query('limit') limit = 20,
    @Query('status') status?: OrderStatus,
  ) {
    return this.svc.getUserOrders(uid, +page, +limit, status);
  }

  @Get('seller')
  @ApiOperation({ summary: 'Get orders containing my products' })
  getSellerOrders(
    @CurrentUser('id') uid: string,
    @Query('page') page = 1, @Query('limit') limit = 20,
  ) {
    return this.svc.getSellerOrders(uid, +page, +limit);
  }

  @Get(':id')
  getOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.findById(id, user.id, user.role);
  }

  @Patch(':id/advance')
  @ApiOperation({ summary: 'Advance order to next status (seller/admin)' })
  advanceStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('note') note?: string,
  ) {
    return this.svc.advanceStatus(id, user.id, user.role, note);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('reason') reason?: string,
  ) {
    return this.svc.cancelOrder(id, user.id, user.role, reason);
  }

  // ── Admin ─────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/all')
  getAllOrders(
    @Query('page') page = 1, @Query('limit') limit = 20,
    @Query('status') status?: string, @Query('search') search?: string,
  ) {
    return this.svc.getAllOrders(+page, +limit, status, search);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/stats')
  getStats() {
    return this.svc.getOrderStats();
  }
}
