export declare enum ProviderType {
    INDIVIDUAL = "individual",
    COMPANY = "company"
}
export declare enum ProviderStatus {
    PENDING = "pending",
    ACTIVE = "active",
    SUSPENDED = "suspended"
}
export declare enum VehicleType {
    MOTORCYCLE = "motorcycle",
    CAR = "car",
    VAN = "van",
    TRUCK = "truck",
    BICYCLE = "bicycle",
    OTHER = "other"
}
export declare enum ShipmentStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    PICKED_UP = "picked_up",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    FAILED = "failed"
}
export declare class LogisticsProvider {
    id: string;
    userId: string;
    type: ProviderType;
    name: string;
    description: string;
    logo: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    coverageStates: string[];
    coverageCities: string[];
    vehicleTypes: string[];
    baseRate: number;
    ratePerKm: number;
    currency: string;
    maxWeightKg: number;
    status: ProviderStatus;
    isVerified: boolean;
    isAvailable: boolean;
    rating: number;
    totalDeliveries: number;
    totalRatings: number;
    businessRegNumber: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class LogisticsAgent {
    id: string;
    providerId: string;
    userId: string;
    name: string;
    phone: string;
    email: string;
    avatar: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    coverageAreas: string[];
    isAvailable: boolean;
    isActive: boolean;
    totalDeliveries: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface PickupAddress {
    address: string;
    city: string;
    state: string;
    phone: string;
    contactName: string;
}
export interface StatusHistoryEntry {
    status: ShipmentStatus;
    timestamp: string;
    note?: string;
    updatedBy?: string;
    location?: string;
}
export declare class ShipmentAssignment {
    id: string;
    orderId: string;
    sellerId: string;
    providerId: string;
    agentId: string;
    status: ShipmentStatus;
    pickupAddress: PickupAddress;
    agreedRate: number;
    currency: string;
    estimatedPickup: Date;
    estimatedDelivery: Date;
    actualPickup: Date;
    actualDelivery: Date;
    rejectionReason: string;
    proofOfDelivery: string;
    sellerNote: string;
    providerNote: string;
    statusHistory: StatusHistoryEntry[];
    createdAt: Date;
    updatedAt: Date;
}
