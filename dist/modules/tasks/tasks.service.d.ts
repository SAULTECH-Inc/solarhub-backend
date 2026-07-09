import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { EscrowService } from '../escrow/escrow.service';
export declare class TasksService {
    private readonly userRepo;
    private readonly notif;
    private readonly redis;
    private readonly escrow;
    private readonly logger;
    constructor(userRepo: Repository<User>, notif: NotificationsService, redis: RedisService, escrow: EscrowService);
    scheduledReminder(): Promise<void>;
    remindUnverifiedUsers(): Promise<{
        reminded: number;
        skipped: number;
    }>;
    scheduledEscrowAutoRelease(): Promise<void>;
    processEscrowAutoReleases(): Promise<{
        released: number;
        errors: number;
    }>;
}
