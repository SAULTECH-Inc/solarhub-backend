import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Notifications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  getAll(@CurrentUser('id') uid: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.getUserNotifications(uid, +page, +limit);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') uid: string) {
    return this.svc.getUnreadCount(uid).then(count => ({ count }));
  }

  @Patch('mark-read')
  markRead(@CurrentUser('id') uid: string, @Body('ids') ids: string[] = []) {
    return this.svc.markRead(uid, ids);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser('id') uid: string) {
    return this.svc.markAllRead(uid);
  }
}
