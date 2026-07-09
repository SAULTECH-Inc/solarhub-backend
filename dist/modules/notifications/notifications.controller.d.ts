import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly svc;
    constructor(svc: NotificationsService);
    getAll(uid: string, page?: number, limit?: number): Promise<{
        unread: number;
        data: import("./notification.entity").Notification[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    unreadCount(uid: string): Promise<{
        count: number;
    }>;
    markRead(uid: string, ids?: string[]): Promise<void>;
    markAllRead(uid: string): Promise<void>;
    registerToken(uid: string, token: string, platform: string): Promise<{
        ok: boolean;
    }>;
    unregisterToken(uid: string, token: string): Promise<{
        ok: boolean;
    }>;
}
