"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FirebaseAdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAdminService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FirebaseAdminService = FirebaseAdminService_1 = class FirebaseAdminService {
    constructor(cfg) {
        this.cfg = cfg;
        this.logger = new common_1.Logger(FirebaseAdminService_1.name);
        this.messaging = null;
    }
    async onModuleInit() {
        const serviceAccountJson = this.cfg.get('firebase.serviceAccountKey');
        if (!serviceAccountJson) {
            this.logger.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set — push notifications disabled');
            return;
        }
        try {
            const { initializeApp, getApps, cert } = await Promise.resolve().then(() => require('firebase-admin/app'));
            const { getMessaging } = await Promise.resolve().then(() => require('firebase-admin/messaging'));
            const serviceAccount = JSON.parse(serviceAccountJson);
            const app = getApps().length
                ? getApps()[0]
                : initializeApp({ credential: cert(serviceAccount) });
            this.messaging = getMessaging(app);
            this.logger.log('Firebase Admin SDK initialised');
        }
        catch (e) {
            this.logger.warn(`Firebase Admin SDK unavailable — push notifications disabled: ${e.message}`);
        }
    }
    isReady() {
        return !!this.messaging;
    }
    async sendMulticast(tokens, title, body, data = {}) {
        if (!this.messaging || !tokens.length)
            return;
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
            }
            catch (e) {
                this.logger.error('FCM sendMulticast error', e.message);
            }
        }
    }
};
exports.FirebaseAdminService = FirebaseAdminService;
exports.FirebaseAdminService = FirebaseAdminService = FirebaseAdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseAdminService);
//# sourceMappingURL=firebase-admin.service.js.map