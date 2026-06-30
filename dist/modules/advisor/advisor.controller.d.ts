import { AdvisorService } from './advisor.service';
export declare class AdvisorController {
    private readonly svc;
    constructor(svc: AdvisorService);
    calculate(body: any, user?: any): Promise<{
        session: import("./advisor.entity").AdvisorSession;
        results: any;
    }>;
    getSessions(uid: string): Promise<import("./advisor.entity").AdvisorSession[]>;
    getSession(id: string): Promise<import("./advisor.entity").AdvisorSession>;
    saveSelection(id: string, recId: string): Promise<void>;
    getMarketplaceItems(id: string, tier: string, preference: string): Promise<{
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
}
