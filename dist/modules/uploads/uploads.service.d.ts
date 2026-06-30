import { ConfigService } from '@nestjs/config';
export declare class UploadsService {
    private readonly cfg;
    private readonly logger;
    private readonly anthropic;
    constructor(cfg: ConfigService);
    uploadImage(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        publicId: string;
    }>;
    uploadMultiple(files: Express.Multer.File[], folder?: string): Promise<{
        url: string;
        publicId: string;
    }[]>;
    uploadVideo(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        publicId: string;
        resourceType: string;
    }>;
    uploadMedia(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        publicId: string;
        resourceType: string;
    }>;
    uploadMultipleMedia(files: Express.Multer.File[], folder?: string): Promise<{
        url: string;
        publicId: string;
        resourceType: string;
    }[]>;
    uploadAvatar(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        publicId: string;
    }>;
    deleteFile(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<void>;
    extractSpecsFromLabel(file: Express.Multer.File, category: string): Promise<Record<string, any>>;
}
