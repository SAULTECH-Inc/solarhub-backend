import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiQuery, ApiParam,
} from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import {
  RegisterProviderDto, AddAgentDto, AssignShipmentDto,
  UpdateShipmentStatusDto, RejectShipmentDto,
  AssignAgentDto, QueryProvidersDto, QueryShipmentsDto,
} from './logistics.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';
import { ShipmentStatus } from './logistics.entity';

@ApiTags('Logistics')
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly svc: LogisticsService) {}

  // ── Provider Self-Service ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('register')
  @ApiOperation({ summary: 'Register as a logistics provider' })
  register(
    @CurrentUser('id') uid: string,
    @Body() dto: RegisterProviderDto,
  ) {
    return this.svc.register(uid, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('me')
  @ApiOperation({ summary: 'Get own logistics provider profile' })
  getMyProfile(@CurrentUser('id') uid: string) {
    return this.svc.getMyProfile(uid);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch('me')
  @ApiOperation({ summary: 'Update own logistics provider profile' })
  updateProfile(
    @CurrentUser('id') uid: string,
    @Body() dto: Partial<RegisterProviderDto>,
  ) {
    return this.svc.updateProfile(uid, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('me/stats')
  @ApiOperation({ summary: 'Get shipment statistics for own provider account' })
  getStats(@CurrentUser('id') uid: string) {
    return this.svc.getStats(uid);
  }

  // ── Public Provider Discovery ─────────────────────────────────────────────

  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'List / search active logistics providers (public)' })
  @ApiQuery({ name: 'state',       required: false })
  @ApiQuery({ name: 'city',        required: false })
  @ApiQuery({ name: 'type',        required: false })
  @ApiQuery({ name: 'vehicleType', required: false })
  @ApiQuery({ name: 'page',        required: false })
  @ApiQuery({ name: 'limit',       required: false })
  listProviders(@Query() query: QueryProvidersDto) {
    return this.svc.listProviders(query);
  }

  @Public()
  @Get('providers/:id')
  @ApiOperation({ summary: 'Get a logistics provider profile (public)' })
  @ApiParam({ name: 'id', description: 'Provider UUID' })
  getProvider(@Param('id') id: string) {
    return this.svc.getProvider(id);
  }

  // ── Agent Management ──────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('me/agents')
  @ApiOperation({ summary: 'Add a delivery agent to your company provider' })
  addAgent(
    @CurrentUser('id') uid: string,
    @Body() dto: AddAgentDto,
  ) {
    return this.svc.addAgent(uid, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('me/agents')
  @ApiOperation({ summary: 'List active agents for own provider' })
  getMyAgents(@CurrentUser('id') uid: string) {
    return this.svc.getMyAgents(uid);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch('me/agents/:id')
  @ApiOperation({ summary: 'Update a delivery agent' })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  updateAgent(
    @CurrentUser('id') uid: string,
    @Param('id') agentId: string,
    @Body() dto: Partial<AddAgentDto>,
  ) {
    return this.svc.updateAgent(uid, agentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Delete('me/agents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a delivery agent' })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  deactivateAgent(
    @CurrentUser('id') uid: string,
    @Param('id') agentId: string,
  ) {
    return this.svc.deactivateAgent(uid, agentId);
  }

  // ── Shipment Assignment (Seller creates) ──────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('shipments')
  @ApiOperation({ summary: 'Assign a shipment to a logistics provider (seller action)' })
  assignShipment(
    @CurrentUser('id') uid: string,
    @Body() dto: AssignShipmentDto,
  ) {
    return this.svc.assignShipment(uid, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('shipments')
  @ApiOperation({ summary: 'List shipments for own provider account' })
  @ApiQuery({ name: 'status', required: false, enum: ShipmentStatus })
  getMyShipments(
    @CurrentUser('id') uid: string,
    @Query() query: QueryShipmentsDto,
  ) {
    return this.svc.getMyShipments(uid, query.status);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('shipments/order/:id')
  @ApiOperation({ summary: 'Get shipment assignment by order ID' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  getShipmentByOrder(@Param('id') orderId: string) {
    return this.svc.getShipmentByOrder(orderId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch('shipments/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a pending shipment (provider action)' })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  acceptShipment(
    @CurrentUser('id') uid: string,
    @Param('id') shipmentId: string,
  ) {
    return this.svc.acceptShipment(uid, shipmentId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch('shipments/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending shipment (provider action)' })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  rejectShipment(
    @CurrentUser('id') uid: string,
    @Param('id') shipmentId: string,
    @Body() dto: RejectShipmentDto,
  ) {
    return this.svc.rejectShipment(uid, shipmentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch('shipments/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update shipment status (provider action)' })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  updateShipmentStatus(
    @CurrentUser('id') uid: string,
    @Param('id') shipmentId: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    return this.svc.updateShipmentStatus(uid, shipmentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch('shipments/:id/agent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a specific agent to a shipment (provider action)' })
  @ApiParam({ name: 'id', description: 'Shipment UUID' })
  assignAgent(
    @CurrentUser('id') uid: string,
    @Param('id') shipmentId: string,
    @Body() dto: AssignAgentDto,
  ) {
    return this.svc.assignAgent(uid, shipmentId, dto);
  }
}
