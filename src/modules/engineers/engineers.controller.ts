import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EngineersService, CreateEngineerDto, EngineerFilters } from './engineers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../../common/decorators';
import { EngineerStatus } from './engineer.entity';

@ApiTags('Engineers')
@Controller('engineers')
export class EngineersController {
  constructor(private readonly svc: EngineersService) {}

  // ── Public endpoints ──────────────────────────────────────
  @Public()
  @Get()
  @ApiOperation({ summary: 'Search / list engineers (public)' })
  @ApiQuery({ name: 'page',           required: false })
  @ApiQuery({ name: 'limit',          required: false })
  @ApiQuery({ name: 'city',           required: false })
  @ApiQuery({ name: 'state',          required: false })
  @ApiQuery({ name: 'specialization', required: false })
  @ApiQuery({ name: 'minRating',      required: false })
  @ApiQuery({ name: 'availableOnly',  required: false })
  @ApiQuery({ name: 'minYears',       required: false })
  search(
    @Query('page')           page           = 1,
    @Query('limit')          limit          = 20,
    @Query('city')           city?          : string,
    @Query('state')          state?         : string,
    @Query('specialization') specialization?: string,
    @Query('minRating')      minRating?     : number,
    @Query('availableOnly')  availableOnly? : string,
    @Query('minYears')       minYears?      : number,
  ) {
    const filters: EngineerFilters = {
      city, state, specialization,
      minRating:    minRating    ? +minRating    : undefined,
      minYears:     minYears     ? +minYears     : undefined,
      availableOnly: availableOnly === 'true',
    };
    return this.svc.search(filters, +page, +limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get public engineer profile' })
  getPublic(@Param('id') id: string) {
    return this.svc.getPublicProfile(id);
  }

  // ── Authenticated endpoints ───────────────────────────────
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('profile/me')
  @ApiOperation({ summary: 'Get own engineer profile' })
  getMyProfile(@CurrentUser('id') uid: string) {
    return this.svc.getOwnProfile(uid);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('profile')
  @ApiOperation({ summary: 'Create engineer profile (becomes engineer)' })
  create(@CurrentUser('id') uid: string, @Body() dto: CreateEngineerDto) {
    return this.svc.createProfile(uid, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch('profile')
  @ApiOperation({ summary: 'Update own engineer profile' })
  update(@CurrentUser('id') uid: string, @Body() dto: Partial<CreateEngineerDto>) {
    return this.svc.updateProfile(uid, dto);
  }

  // ── Admin endpoints ───────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Get('admin/all')
  @ApiOperation({ summary: 'Admin: list all engineers' })
  listAll(
    @Query('page')   page   = 1,
    @Query('limit')  limit  = 20,
    @Query('status') status?: string,
    @Query('state')  state?:  string,
  ) {
    return this.svc.listAll(+page, +limit, { status, state });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Patch('admin/:id/status')
  @ApiOperation({ summary: 'Admin: update engineer status (flag/suspend/activate)' })
  updateStatus(
    @Param('id')          id:        string,
    @Body('status')       status:    EngineerStatus,
    @Body('adminNote')    adminNote: string,
  ) {
    return this.svc.updateStatus(id, status, adminNote);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @Patch('admin/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: mark engineer as verified' })
  verify(@Param('id') id: string) {
    return this.svc.verifyEngineer(id);
  }
}
