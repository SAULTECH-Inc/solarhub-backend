import { ProviderType, VehicleType, ShipmentStatus } from './logistics.entity';
export declare class RegisterProviderDto {
    type: ProviderType;
    name: string;
    description?: string;
    phone: string;
    email: string;
    address?: string;
    city?: string;
    state?: string;
    coverageStates: string[];
    coverageCities: string[];
    vehicleTypes: string[];
    baseRate: number;
    ratePerKm?: number;
    currency?: string;
    maxWeightKg?: number;
    businessRegNumber?: string;
    logo?: string;
}
export declare class AddAgentDto {
    name: string;
    phone: string;
    email?: string;
    vehicleType: VehicleType;
    vehicleNumber?: string;
    coverageAreas: string[];
    avatar?: string;
}
export declare class PickupAddressDto {
    address: string;
    city: string;
    state: string;
    phone: string;
    contactName: string;
}
export declare class AssignShipmentDto {
    orderId: string;
    providerId: string;
    pickupAddress: PickupAddressDto;
    agreedRate: number;
    currency?: string;
    sellerNote?: string;
    estimatedPickup?: string;
}
export declare class UpdateShipmentStatusDto {
    status: ShipmentStatus;
    note?: string;
    location?: string;
    proofOfDelivery?: string;
}
export declare class RejectShipmentDto {
    reason: string;
}
export declare class AssignAgentDto {
    agentId: string;
}
export declare class QueryProvidersDto {
    state?: string;
    city?: string;
    type?: ProviderType;
    vehicleType?: string;
    page?: number;
    limit?: number;
}
export declare class QueryShipmentsDto {
    status?: ShipmentStatus;
}
