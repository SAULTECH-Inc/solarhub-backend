import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DisputesService, CreateDisputeDto } from './disputes.service';
import { DisputeStatus, DisputeResolution, DisputePriority, DisputeType, DisputeCategory } from './dispute.entity';
import { JwtAuthGuard }  from '../../common/guards/jwt-auth.guard';
import { RolesGuard }    from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Disputes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly svc: DisputesService) {}

  // ── User: create a dispute ─────────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Raise a dispute or support ticket' })
  create(@CurrentUser('id') uid: string, @Body() dto: CreateDisputeDto) {
    return this.svc.create(uid, dto);
  }

  // ── User: my disputes ──────────────────────────────────────────────────────
  @Get('my')
  @ApiOperation({ summary: 'List my disputes' })
  getMyDisputes(
    @CurrentUser('id') uid: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.getMyDisputes(uid, page, limit);
  }

  // ── User: view single dispute ──────────────────────────────────────────────
  @Get('my/:id')
  @ApiOperation({ summary: 'Get a single dispute (claimant or respondent only)' })
  getOne(@Param('id') id: string, @CurrentUser('id') uid: string) {
    return this.svc.getById(id, uid);
  }

  // ── User: add response (respondent) ───────────────────────────────────────
  @Patch('my/:id/respond')
  @ApiOperation({ summary: 'Add a response to a dispute (respondent)' })
  respond(
    @Param('id') id: string,
    @CurrentUser('id') uid: string,
    @Body('response') response: string,
  ) {
    return this.svc.addResponse(id, uid, response);
  }

  // ── Admin: stats ───────────────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/stats')
  @ApiOperation({ summary: 'Dispute stats for admin dashboard' })
  stats() {
    return this.svc.getStats();
  }

  // ── Admin: list all ────────────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/all')
  @ApiOperation({ summary: 'List all disputes (admin)' })
  adminListAll(
    @Query('page',     new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit',    new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status')   status?: DisputeStatus,
    @Query('type')     type?: DisputeType,
    @Query('priority') priority?: DisputePriority,
    @Query('search')   search?: string,
  ) {
    return this.svc.adminListAll(page, limit, { status, type, priority, search });
  }

  // ── Admin: get single ─────────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/:id')
  adminGetOne(@Param('id') id: string) {
    return this.svc.adminGetById(id);
  }

  // ── Admin: update status ──────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('admin/:id/status')
  @ApiOperation({ summary: 'Update dispute status' })
  adminUpdateStatus(
    @Param('id') id: string,
    @Body('status')       status: DisputeStatus,
    @Body('adminNote')    adminNote?: string,
    @Body('assignedToId') assignedToId?: string,
  ) {
    return this.svc.adminUpdateStatus(id, status, adminNote, assignedToId);
  }

  // ── Admin: set priority ───────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('admin/:id/priority')
  @ApiOperation({ summary: 'Set dispute priority' })
  adminSetPriority(
    @Param('id') id: string,
    @Body('priority') priority: DisputePriority,
  ) {
    return this.svc.adminSetPriority(id, priority);
  }

  // ── Admin: resolve ────────────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('admin/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute with a decision' })
  adminResolve(
    @Param('id') id: string,
    @Body('resolution')    resolution: DisputeResolution,
    @Body('resolutionNote') resolutionNote: string,
  ) {
    return this.svc.adminResolve(id, resolution, resolutionNote);
  }
}
