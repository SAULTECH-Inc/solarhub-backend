import { Repository } from 'typeorm';
import { User, UserStatus } from './user.entity';
import { RedisService } from '../redis/redis.service';
export declare class UsersService {
    private readonly repo;
    private readonly redis;
    constructor(repo: Repository<User>, redis: RedisService);
    findById(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    updateProfile(userId: string, dto: Partial<User>): Promise<User>;
    getProfile(userId: string): Promise<User>;
    addAddress(userId: string, address: Omit<User['addresses'][0], 'id'>): Promise<User>;
    updateAddress(userId: string, addrId: string, update: Partial<User['addresses'][0]>): Promise<User>;
    deleteAddress(userId: string, addrId: string): Promise<User>;
    becomeSeller(userId: string, dto: {
        storeName: string;
        storeDescription?: string;
        storeAddress: string;
        storeCity: string;
        storeState: string;
        storeLatitude?: number;
        storeLongitude?: number;
        businessType?: string;
        businessRegNumber: string;
        nin: string;
        ninData?: Record<string, any>;
        govtIdType: string;
        govtIdUrl?: string;
        taxId?: string;
        storeBanner?: string;
    }): Promise<User>;
    updateSellerProfile(userId: string, dto: Partial<User>): Promise<User>;
    listAll(page: number, limit: number, filters: {
        role?: string;
        status?: string;
        search?: string;
    }): Promise<import("../../common/utils/pagination.util").PaginatedResult<User>>;
    updateStatus(userId: string, status: UserStatus): Promise<User>;
    getStats(): Promise<{
        total: number;
        sellers: number;
        engineers: number;
        buyers: number;
        admins: number;
    }>;
}
