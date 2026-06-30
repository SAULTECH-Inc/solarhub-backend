import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AdvisorSession } from './advisor.entity';
import { Product } from '../products/product.entity';
interface Appliance {
    name: string;
    watts: number;
    quantity: number;
    hoursPerDay: number;
    unit?: string;
}
interface Preferences {
    location: string;
    sunHours: number;
    backupFactor: number;
    gridSituation: 'none' | 'unreliable' | 'reliable';
    priority: 'all' | 'budget' | 'quality' | 'compact';
}
export declare class AdvisorService {
    private readonly sessionRepo;
    private readonly productRepo;
    private readonly cfg;
    private readonly logger;
    private readonly anthropic;
    constructor(sessionRepo: Repository<AdvisorSession>, productRepo: Repository<Product>, cfg: ConfigService);
    calculate(appliances: Appliance[], preferences: Preferences, userId?: string): Promise<{
        session: AdvisorSession;
        results: any;
    }>;
    getMarketplaceItemsForSession(sessionId: string, tier: string, preference?: 'budget' | 'quality' | 'balanced'): Promise<{
        tier: string;
        preference: "budget" | "quality" | "balanced";
        recommendation: {
            panels: {
                quantity: any;
                wattageEach: any;
            };
            batteries: {
                quantity: any;
                type: string;
                capacity: any;
            };
            inverter: {
                capacityKva: any;
                type: any;
            };
            chargeController: {
                currentA: any;
            };
        };
        products: {
            panels: {
                id: string;
                name: string;
                slug: string;
                price: number;
                currency: any;
                thumbnail: string;
                averageRating: number;
                reviewCount: number;
                brand: string;
                location: string;
            }[];
            batteries: {
                id: string;
                name: string;
                slug: string;
                price: number;
                currency: any;
                thumbnail: string;
                averageRating: number;
                reviewCount: number;
                brand: string;
                location: string;
            }[];
            inverters: {
                id: string;
                name: string;
                slug: string;
                price: number;
                currency: any;
                thumbnail: string;
                averageRating: number;
                reviewCount: number;
                brand: string;
                location: string;
            }[];
            controllers: {
                id: string;
                name: string;
                slug: string;
                price: number;
                currency: any;
                thumbnail: string;
                averageRating: number;
                reviewCount: number;
                brand: string;
                location: string;
            }[];
            accessories: {
                id: string;
                name: string;
                slug: string;
                price: number;
                currency: any;
                thumbnail: string;
                averageRating: number;
                reviewCount: number;
                brand: string;
                location: string;
            }[];
        };
    }>;
    private getProductPriceContext;
    private buildProductQuery;
    getSession(id: string): Promise<AdvisorSession>;
    getUserSessions(userId: string): Promise<AdvisorSession[]>;
    saveSelection(sessionId: string, recommendationId: string): Promise<void>;
    private fallbackCalc;
}
export {};
