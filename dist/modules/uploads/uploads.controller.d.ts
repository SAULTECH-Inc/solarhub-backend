import { UploadsService } from './uploads.service';
import { UsersService } from '../users/users.service';
export declare class UploadsController {
    private readonly svc;
    private readonly users;
    constructor(svc: UploadsService, users: UsersService);
    uploadOne(file: any, folder?: string): Promise<{
        url: string;
        publicId: string;
    }>;
    uploadMany(files: any[], folder?: string): Promise<{
        url: string;
        publicId: string;
    }[]>;
    uploadMedia(file: any, folder?: string): Promise<{
        url: string;
        publicId: string;
        resourceType: string;
    }>;
    uploadMediaMultiple(files: any[], folder?: string): Promise<{
        url: string;
        publicId: string;
        resourceType: string;
    }[]>;
    uploadAvatar(file: any, userId: string): Promise<{
        url: string;
        publicId: string;
    }>;
    deleteByQuery(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<void>;
    deleteById(publicId: string): Promise<void>;
    extractSpecs(file: any, category: string): Promise<Record<string, any>>;
}
