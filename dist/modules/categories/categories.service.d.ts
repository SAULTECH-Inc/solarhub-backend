import { OnModuleInit } from '@nestjs/common';
import { TreeRepository } from 'typeorm';
import { Category } from './category.entity';
import { RedisService } from '../redis/redis.service';
export declare class CategoriesService implements OnModuleInit {
    private readonly repo;
    private readonly redis;
    private readonly logger;
    constructor(repo: TreeRepository<Category>, redis: RedisService);
    onModuleInit(): Promise<void>;
    private seedCategories;
    findAll(): Promise<Category[]>;
    findBySlug(slug: string): Promise<Category>;
    findById(id: string): Promise<Category>;
    getSpecSchema(categoryId: string): Promise<Record<string, {
        label: string;
        type: "text" | "number" | "select" | "multiselect";
        unit?: string;
        options?: string[];
        required: boolean;
        group?: string;
    }>>;
}
