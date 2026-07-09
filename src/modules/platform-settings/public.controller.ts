import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators';
import { PlatformSettingsService } from './platform-settings.service';

@ApiTags('Platform')
@Controller('platform')
export class PublicController {
  constructor(private readonly svc: PlatformSettingsService) {}

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Public platform settings (feature flags visible to UI)' })
  async getPublicSettings() {
    const all = await this.svc.getAll();
    // Return as key→value map for easy consumption
    return Object.fromEntries(all.map(s => [s.key, s.value]));
  }
}
