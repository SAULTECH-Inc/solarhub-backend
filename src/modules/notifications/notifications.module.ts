import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { EmailProcessor } from './email.processor';
import { NotificationsController } from './notifications.controller';
import { Notification } from './notification.entity';
import { PushToken } from './push-token.entity';
import { FirebaseAdminService } from './firebase-admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushToken]),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        transport: {
          host:   cfg.get('email.host'),
          port:   cfg.get<number>('email.port'),
          secure: cfg.get<number>('email.port') === 465,
          auth: { user: cfg.get('email.user'), pass: cfg.get('email.pass') },
        },
        defaults: {
          from: `"${cfg.get('email.fromName')}" <${cfg.get('email.fromEmail')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
    BullModule.registerQueue({ name: 'email' }),
  ],
  providers: [NotificationsService, EmailProcessor, FirebaseAdminService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
