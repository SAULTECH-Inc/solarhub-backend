import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
export declare class EscrowFeatureGuard implements CanActivate {
    private readonly settings;
    constructor(settings: PlatformSettingsService);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
