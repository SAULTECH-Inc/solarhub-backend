import { PlatformSettingsService } from './platform-settings.service';
export declare class PublicController {
    private readonly svc;
    constructor(svc: PlatformSettingsService);
    getPublicSettings(): Promise<{
        [k: string]: string;
    }>;
}
