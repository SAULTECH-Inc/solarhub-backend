import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';

@Injectable()
export class EscrowFeatureGuard implements CanActivate {
  constructor(private readonly settings: PlatformSettingsService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const enabled = await this.settings.getBoolean('escrow_enabled');
    if (!enabled) {
      throw new ServiceUnavailableException('Escrow is currently unavailable on this platform');
    }
    return true;
  }
}
