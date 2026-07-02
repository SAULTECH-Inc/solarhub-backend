export declare enum UserRole {
    BUYER = "buyer",
    SELLER = "seller",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare enum AuthProvider {
    LOCAL = "local",
    GOOGLE = "google"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING = "pending"
}
export declare class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    avatar: string;
    role: UserRole;
    isSuperAdmin: boolean;
    provider: AuthProvider;
    googleId: string;
    status: UserStatus;
    emailVerified: boolean;
    emailVerificationToken: string;
    refreshToken: string;
    refreshTokenExpiry: Date;
    lastLoginAt: Date;
    lastLoginIp: string;
    isSeller: boolean;
    isEngineer: boolean;
    isLogistics: boolean;
    storeName: string;
    storeDescription: string;
    storeBanner: string;
    storeAddress: string;
    storeCity: string;
    storeState: string;
    storeLatitude: number;
    storeLongitude: number;
    businessType: string;
    businessRegNumber: string;
    taxId: string;
    nin: string;
    ninData: Record<string, any>;
    govtIdType: string;
    govtIdUrl: string;
    sellerProfileComplete: boolean;
    sellerVerified: boolean;
    sellerRating: number;
    totalSales: number;
    totalOrders: number;
    subscriptionTier: string;
    subscriptionStatus: string;
    trialEndsAt: Date;
    subscriptionExpiresAt: Date;
    notificationPrefs: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    socialLinks: {
        whatsapp?: string;
        instagram?: string;
        facebook?: string;
        twitter?: string;
    };
    addresses: Array<{
        id: string;
        label: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        country: string;
        isDefault: boolean;
    }>;
    loginAttempts: number;
    lockoutUntil: Date;
    passwordResetToken: string;
    passwordResetExpiry: Date;
    createdAt: Date;
    updatedAt: Date;
    hashPassword(): Promise<void>;
    comparePassword(plain: string): Promise<boolean>;
    get fullName(): string;
    get isLocked(): boolean;
}
