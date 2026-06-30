import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private messaging: any = null;

  constructor(private readonly cfg: ConfigService) {}

  async onModuleInit() {
    const serviceAccountJson = this.cfg.get<string>('firebase.serviceAccountKey');
    if (!serviceAccountJson) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set — push notifications disabled');
      return;
    }

    try {
      // Dynamic import so a bundling failure doesn't crash the Lambda cold start.
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');

      const serviceAccount = JSON.parse(serviceAccountJson);
      const app = getApps().length
        ? getApps()[0]
        : initializeApp({ credential: cert(serviceAccount) });
      this.messaging = getMessaging(app);
      this.logger.log('Firebase Admin SDK initialised');
    } catch (e: any) {
      this.logger.warn(`Firebase Admin SDK unavailable — push notifications disabled: ${e.message}`);
    }
  }

  isReady(): boolean {
    return !!this.messaging;
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string> = {},
  ): Promise<void> {
    if (!this.messaging || !tokens.length) return;

    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      try {
        const res = await this.messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
          data,
          webpush: {
            notification: { icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' },
            fcmOptions: { link: data['url'] || '/' },
          },
          apns: {
            payload: { aps: { sound: 'default', badge: 1 } },
          },
        });
        if (res.failureCount > 0) {
          this.logger.warn(`FCM: ${res.failureCount}/${chunk.length} tokens failed`);
        }
      } catch (e: any) {
        this.logger.error('FCM sendMulticast error', e.message);
      }
    }
  }
}
