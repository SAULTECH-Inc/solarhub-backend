import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserStatus } from './user.entity';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@CurrentUser('id') uid: string) {
    return this.svc.getProfile(uid);
  }

  @Patch('profile')
  updateProfile(@CurrentUser('id') uid: string, @Body() dto: any) {
    return this.svc.updateProfile(uid, dto);
  }

  @Get('addresses')
  getAddresses(@CurrentUser('id') uid: string) {
    return this.svc.getProfile(uid).then(u => u.addresses);
  }

  @Post('addresses')
  addAddress(@CurrentUser('id') uid: string, @Body() dto: any) {
    return this.svc.addAddress(uid, dto);
  }

  @Patch('addresses/:id')
  updateAddress(@CurrentUser('id') uid: string, @Param('id') aid: string, @Body() dto: any) {
    return this.svc.updateAddress(uid, aid, dto);
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser('id') uid: string, @Param('id') aid: string) {
    return this.svc.deleteAddress(uid, aid);
  }

  @Post('become-seller')
  becomeSeller(@CurrentUser('id') uid: string, @Body() dto: any) {
    return this.svc.becomeSeller(uid, dto);
  }

  @Patch('seller-profile')
  updateSellerProfile(@CurrentUser('id') uid: string, @Body() dto: any) {
    return this.svc.updateSellerProfile(uid, dto);
  }

  @Get('public/:id')
  getPublicProfile(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  // ── Admin endpoints ───────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/all')
  listAll(
    @Query('page') page = 1, @Query('limit') limit = 20,
    @Query('role') role?: string, @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.listAll(+page, +limit, { role, status, search });
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.svc.updateStatus(id, status);
  }
}
