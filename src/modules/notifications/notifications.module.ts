import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NotificationsService } from './notifications.service';
import { EmailProcessor } from './email.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
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
  providers: [NotificationsService, EmailProcessor],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
