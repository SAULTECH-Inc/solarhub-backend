import { ConfigService } from '@nestjs/config';
import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly svc;
    private readonly cfg;
    private readonly logger;
    constructor(svc: TasksService, cfg: ConfigService);
    cronRemindUnverified(auth: string): Promise<{
        reminded: number;
        skipped: number;
    }>;
}
