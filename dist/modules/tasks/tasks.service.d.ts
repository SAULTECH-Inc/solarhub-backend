import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
export declare class TasksService {
    private readonly userRepo;
    private readonly notif;
    private readonly redis;
    private readonly logger;
    constructor(userRepo: Repository<User>, notif: NotificationsService, redis: RedisService);
    scheduledReminder(): Promise<void>;
    remindUnverifiedUsers(): Promise<{
        reminded: number;
        skipped: number;
    }>;
}
