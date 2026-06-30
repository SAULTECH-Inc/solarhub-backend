import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class FirebaseAdminService implements OnModuleInit {
    private readonly cfg;
    private readonly logger;
    private messaging;
    constructor(cfg: ConfigService);
    onModuleInit(): void;
    isReady(): boolean;
    sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>;
}
