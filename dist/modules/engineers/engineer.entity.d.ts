import { User } from '../users/user.entity';
export declare enum EngineerStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    FLAGGED = "flagged"
}
export declare class Engineer {
    id: string;
    userId: string;
    user: User;
    fullName: string;
    phone: string;
    nin: string;
    ninData: Record<string, any>;
    govtIdType: string;
    govtIdUrl: string;
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    serviceRadiusKm: number;
    bio: string;
    profilePhoto: string;
    yearsOfExperience: number;
    specializations: string[];
    certifications: Array<{
        name: string;
        issuer: string;
        year?: number;
        url?: string;
    }>;
    availableForHire: boolean;
    socialLinks: {
        whatsapp?: string;
        instagram?: string;
        facebook?: string;
        twitter?: string;
    };
    status: EngineerStatus;
    adminNote: string;
    averageRating: number;
    reviewCount: number;
    completedJobs: number;
    isVerified: boolean;
    verifiedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
