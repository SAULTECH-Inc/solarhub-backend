import {
  Controller, Get, Post, Patch, Param, Body,
  Query, UseGuards, HttpCode, HttpStatus, Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Public } from '../../common/decorators';
import { UserStatus } from '../users/user.entity';

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly svc:      AdminService,
    private readonly users:    UsersService,
    private readonly products: ProductsService,
    private readonly orders:   OrdersService,
  ) {}

  // ── Seed super-admin (public, key-protected) ──────────────
  @Public()
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Promote or create a super-admin account (requires ADMIN_SEED_KEY header)' })
  seedSuperAdmin(
    @Headers('x-seed-key') key: string,
    @Body('email') email: string,
    @Body('password') password?: string,
  ) {
    return this.svc.seedSuperAdmin(key, email, password);
  }

  // ── Dashboard ─────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getDashboard() { return this.svc.getDashboard(); }

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  getHealth() { return this.svc.getSystemHealth(); }

  @Get('search')
  globalSearch(@Query('q') q: string) { return this.svc.globalSearch(q); }

  // ── Users ─────────────────────────────────────────────────
  @Get('users')
  listUsers(
    @Query('page') p = 1, @Query('limit') l = 20,
    @Query('role') role?: string, @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.users.listAll(+p, +l, { role, status, search });
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.users.updateStatus(id, status);
  }

  @Patch('users/:id/verify-seller')
  verifySeller(@Param('id') id: string, @Body('approved') approved: boolean) {
    return this.svc.verifySeller(id, approved);
  }

  @Get('users/stats')
  userStats() { return this.users.getStats(); }

  // ── Products ──────────────────────────────────────────────
  @Get('products/pending')
  @ApiOperation({ summary: 'Products awaiting approval' })
  getPendingProducts() { return this.svc.getPendingProducts(); }

  @Patch('products/:id/moderate')
  @ApiOperation({ summary: 'Approve or reject a product listing' })
  moderate(
    @Param('id') id: string,
    @Body('action') action: 'approve' | 'reject',
    @Body('reason') reason?: string,
  ) {
    return this.svc.moderateProduct(id, action, reason);
  }

  @Patch('products/:id/feature')
  @ApiOperation({ summary: 'Feature or unfeature a product' })
  setFeatured(
    @Param('id') id: string,
    @Body('featured') featured: boolean,
    @Body('badge') badge?: string,
  ) {
    return this.svc.setFeatured(id, featured, badge);
  }

  @Get('products/stats')
  productStats() { return this.products.getStats(); }

  // ── Orders ────────────────────────────────────────────────
  @Get('orders')
  listOrders(
    @Query('page') p = 1, @Query('limit') l = 20,
    @Query('status') status?: string, @Query('search') search?: string,
  ) {
    return this.orders.getAllOrders(+p, +l, status, search);
  }

  @Patch('orders/:id/advance')
  advanceOrder(@Param('id') id: string, @Body('note') note?: string) {
    return this.orders.advanceStatus(id, 'admin', 'admin', note);
  }

  @Get('orders/stats')
  orderStats() { return this.orders.getOrderStats(); }
}
