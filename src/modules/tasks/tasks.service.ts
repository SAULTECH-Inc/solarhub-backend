import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserStatus } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { generateOtp } from '../../common/utils/pagination.util';

const REMINDER_COOLDOWN_S = 48 * 60 * 60; // one reminder per 2 days per user
const MIN_AGE_H = 24;   // only remind users who registered at least 24 h ago
const MAX_AGE_D = 7;    // stop reminding after 7 days (account is likely abandoned)

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notif: NotificationsService,
    private readonly redis: RedisService,
  ) {}

  // Runs at 10:00 AM daily (UTC). Won't fire on Vercel serverless;
  // call runReminderJob() via the /tasks/cron endpoint instead.
  @Cron('0 10 * * *')
  async scheduledReminder() {
    this.logger.log('Scheduled: remindUnverifiedUsers starting');
    await this.remindUnverifiedUsers();
  }

  async remindUnverifiedUsers(): Promise<{ reminded: number; skipped: number }> {
    const now = new Date();
    const minAge = new Date(now.getTime() - MIN_AGE_H * 60 * 60 * 1000);
    const maxAge = new Date(now.getTime() - MAX_AGE_D * 24 * 60 * 60 * 1000);

    const users = await this.userRepo.find({
      where: {
        emailVerified: false,
        status: UserStatus.PENDING,
        createdAt: Between(maxAge, minAge),
      },
      select: ['id', 'email', 'firstName', 'createdAt'],
      take: 200,
    });

    let reminded = 0;
    let skipped = 0;

    for (const user of users) {

      const cooldownKey = `reminder:unverified:${user.id}`;
      const alreadySent = await this.redis.get(cooldownKey);
      if (alreadySent) { skipped++; continue; }

      try {
        const otp = generateOtp();
        await this.redis.setOtp(user.email, otp, 600);
        await this.notif.sendVerificationReminder(user as User, otp);
        await this.redis.set(cooldownKey, '1', REMINDER_COOLDOWN_S);
        reminded++;
        this.logger.log(`Reminder sent to ${user.email}`);
      } catch (e) {
        this.logger.warn(`Failed to remind ${user.email}: ${e.message}`);
        skipped++;
      }
    }

    this.logger.log(`remindUnverifiedUsers done — reminded: ${reminded}, skipped: ${skipped}`);
    return { reminded, skipped };
  }
}
