import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PlatformSetting } from './platform-setting.entity';
export declare class PlatformSettingsService implements OnModuleInit {
    private readonly repo;
    private readonly logger;
    constructor(repo: Repository<PlatformSetting>);
    onModuleInit(): Promise<void>;
    get(key: string): Promise<string | null>;
    getBoolean(key: string): Promise<boolean>;
    getNumber(key: string): Promise<number>;
    set(key: string, value: string): Promise<PlatformSetting>;
    getAll(): Promise<PlatformSetting[]>;
}
