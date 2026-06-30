import { Controller, Post, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(
    private readonly svc: TasksService,
    private readonly cfg: ConfigService,
  ) {}

  /**
   * Called by Vercel Cron (or any external scheduler).
   * Vercel sends: Authorization: Bearer <CRON_SECRET>
   */
  @Public()
  @Post('cron/remind-unverified')
  @ApiOperation({ summary: 'Trigger unverified-account reminder job (cron endpoint)' })
  async cronRemindUnverified(@Headers('authorization') auth: string) {
    const secret = this.cfg.get<string>('app.cronSecret');
    if (secret) {
      const provided = auth?.replace(/^Bearer\s+/i, '');
      if (provided !== secret) throw new UnauthorizedException('Invalid cron secret');
    }
    this.logger.log('Cron endpoint triggered: remind-unverified');
    return this.svc.remindUnverifiedUsers();
  }
}
