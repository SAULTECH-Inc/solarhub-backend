import { ProductsService } from './products.service';
import { UploadsService } from '../uploads/uploads.service';
export declare class ProductsController {
    private readonly svc;
    private readonly uploads;
    constructor(svc: ProductsService, uploads: UploadsService);
    search(page?: number, limit?: number, search?: string, category?: string, minPrice?: number, maxPrice?: number, city?: string, state?: string, condition?: string, featured?: boolean): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./product.entity").Product>>;
    getFeatured(limit?: number): Promise<import("./product.entity").Product[]>;
    findOne(idOrSlug: string): Promise<import("./product.entity").Product>;
    create(dto: any, user: any): Promise<import("./product.entity").Product>;
    update(id: string, dto: any, user: any): Promise<import("./product.entity").Product>;
    delete(id: string, user: any): Promise<void>;
    uploadImage(id: string, file: any, user: any): Promise<import("./product.entity").Product>;
    scanLabel(file: any, category: string): Promise<Record<string, any>>;
    getEditLock(productId: string, user: any): Promise<{
        locked: boolean;
        reason?: string;
    }>;
    getMyProducts(uid: string, page?: number, limit?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./product.entity").Product>>;
    getListingQuota(user: any): Promise<{
        tier: string;
        used: number;
        limit: number;
        remaining: number;
        canPost: boolean;
    }>;
    approve(id: string): Promise<import("./product.entity").Product>;
}
