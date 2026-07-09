export declare class AdvisorSession {
    id: string;
    userId: string;
    appliances: Array<{
        name: string;
        watts: number;
        quantity: number;
        hoursPerDay: number;
        unit: string;
    }>;
    preferences: {
        location: string;
        sunHours: number;
        backupFactor: number;
        gridSituation: string;
        priority: string;
    };
    results: {
        adjustedDailyLoad: number;
        peakLoad: number;
        recommendations: any[];
    };
    totalWh: number;
    peakWatts: number;
    selectedRecommendation: string;
    createdAt: Date;
}
