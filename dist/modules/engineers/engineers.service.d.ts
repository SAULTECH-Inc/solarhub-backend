import { Repository } from 'typeorm';
import { Engineer, EngineerStatus } from './engineer.entity';
import { User } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';
export interface CreateEngineerDto {
    fullName: string;
    phone?: string;
    nin: string;
    ninData?: Record<string, any>;
    govtIdType: string;
    govtIdUrl?: string;
    address: string;
    city: string;
    state: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    serviceRadiusKm?: number;
    bio?: string;
    profilePhoto?: string;
    yearsOfExperience?: number;
    specializations?: string[];
    certifications?: Array<{
        name: string;
        issuer: string;
        year?: number;
        url?: string;
    }>;
    availableForHire?: boolean;
}
export interface EngineerFilters {
    city?: string;
    state?: string;
    specialization?: string;
    minRating?: number;
    availableOnly?: boolean;
    minYears?: number;
}
export declare class EngineersService {
    private readonly repo;
    private readonly userRepo;
    private readonly redis;
    constructor(repo: Repository<Engineer>, userRepo: Repository<User>, redis: RedisService);
    createProfile(userId: string, dto: CreateEngineerDto): Promise<Engineer>;
    updateProfile(userId: string, dto: Partial<CreateEngineerDto>): Promise<Engineer>;
    getOwnProfile(userId: string): Promise<Engineer>;
    getPublicProfile(id: string): Promise<Engineer>;
    search(filters: EngineerFilters, page: number, limit: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<Engineer>>;
    updateRating(engineerId: string, avg: number, count: number): Promise<void>;
    updateStatus(id: string, status: EngineerStatus, adminNote?: string): Promise<Engineer>;
    verifyEngineer(id: string): Promise<Engineer>;
    listAll(page: number, limit: number, filters: {
        status?: string;
        state?: string;
    }): Promise<import("../../common/utils/pagination.util").PaginatedResult<Engineer>>;
}
