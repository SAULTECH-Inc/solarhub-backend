import {
  Controller, Get, Post, Patch, Param,
  Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { ChatRoomType } from './chat.entity';

@ApiTags('Chat')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly svc: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get current user chat rooms' })
  getMyRooms(@CurrentUser('id') uid: string, @Query('page') p = 1, @Query('limit') l = 20) {
    return this.svc.getUserRooms(uid, +p, +l);
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Create or get a support room' })
  createRoom(
    @CurrentUser('id') uid: string,
    @Body() body: { type?: ChatRoomType; productId?: string; orderId?: string; subject?: string; agentId?: string },
  ) {
    return this.svc.getOrCreateRoom(uid, body.type, body);
  }

  @Get('rooms/:id')
  getRoom(@Param('id') id: string) {
    return this.svc.getRoomById(id);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get paginated message history' })
  getMessages(
    @Param('id') id: string,
    @Query('page') p = 1,
    @Query('limit') l = 50,
  ) {
    return this.svc.getRoomMessages(id, +p, +l);
  }

  @Patch('rooms/:id/close')
  closeRoom(@Param('id') id: string) {
    return this.svc.closeRoom(id);
  }

  @Patch('rooms/:id/mark-read')
  markRead(@Param('id') id: string, @CurrentUser('id') uid: string) {
    return this.svc.markMessagesRead(id, uid);
  }

  // ── Agent endpoints ───────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('agent/queue')
  getQueue(@Query('page') p = 1, @Query('limit') l = 20) {
    return this.svc.getQueuedRooms(+p, +l);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('agent/my-rooms')
  getAgentRooms(@CurrentUser('id') uid: string, @Query('page') p = 1, @Query('limit') l = 20) {
    return this.svc.getAgentRooms(uid, +p, +l);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('rooms/:id/assign')
  assignAgent(@Param('id') id: string, @CurrentUser('id') uid: string) {
    return this.svc.assignAgent(id, uid);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/stats')
  getStats() { return this.svc.getChatStats(); }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('admin/gateway-stats')
  getGatewayStats() {
    return {
      onlineUsers:  this.gateway.onlineUserCount,
      onlineAgents: this.gateway.agentCount,
    };
  }
}
