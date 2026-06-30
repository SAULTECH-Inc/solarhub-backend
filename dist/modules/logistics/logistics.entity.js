"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipmentAssignment = exports.LogisticsAgent = exports.LogisticsProvider = exports.ShipmentStatus = exports.VehicleType = exports.ProviderStatus = exports.ProviderType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
var ProviderType;
(function (ProviderType) {
    ProviderType["INDIVIDUAL"] = "individual";
    ProviderType["COMPANY"] = "company";
})(ProviderType || (exports.ProviderType = ProviderType = {}));
var ProviderStatus;
(function (ProviderStatus) {
    ProviderStatus["PENDING"] = "pending";
    ProviderStatus["ACTIVE"] = "active";
    ProviderStatus["SUSPENDED"] = "suspended";
})(ProviderStatus || (exports.ProviderStatus = ProviderStatus = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["MOTORCYCLE"] = "motorcycle";
    VehicleType["CAR"] = "car";
    VehicleType["VAN"] = "van";
    VehicleType["TRUCK"] = "truck";
    VehicleType["BICYCLE"] = "bicycle";
    VehicleType["OTHER"] = "other";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var ShipmentStatus;
(function (ShipmentStatus) {
    ShipmentStatus["PENDING"] = "pending";
    ShipmentStatus["ACCEPTED"] = "accepted";
    ShipmentStatus["REJECTED"] = "rejected";
    ShipmentStatus["PICKED_UP"] = "picked_up";
    ShipmentStatus["IN_TRANSIT"] = "in_transit";
    ShipmentStatus["DELIVERED"] = "delivered";
    ShipmentStatus["FAILED"] = "failed";
})(ShipmentStatus || (exports.ShipmentStatus = ShipmentStatus = {}));
let LogisticsProvider = class LogisticsProvider {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, userId: { required: true, type: () => String }, type: { required: true, enum: require("./logistics.entity").ProviderType }, name: { required: true, type: () => String }, description: { required: true, type: () => String }, logo: { required: true, type: () => String }, phone: { required: true, type: () => String }, email: { required: true, type: () => String }, address: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, coverageStates: { required: true, type: () => [String] }, coverageCities: { required: true, type: () => [String] }, vehicleTypes: { required: true, type: () => [String] }, baseRate: { required: true, type: () => Number }, ratePerKm: { required: true, type: () => Number }, currency: { required: true, type: () => String }, maxWeightKg: { required: true, type: () => Number }, status: { required: true, enum: require("./logistics.entity").ProviderStatus }, isVerified: { required: true, type: () => Boolean }, isAvailable: { required: true, type: () => Boolean }, rating: { required: true, type: () => Number }, totalDeliveries: { required: true, type: () => Number }, totalRatings: { required: true, type: () => Number }, businessRegNumber: { required: true, type: () => String }, metadata: { required: true, type: () => Object }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.LogisticsProvider = LogisticsProvider;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProviderType }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 1000 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 300 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], LogisticsProvider.prototype, "coverageStates", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], LogisticsProvider.prototype, "coverageCities", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], LogisticsProvider.prototype, "vehicleTypes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], LogisticsProvider.prototype, "baseRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], LogisticsProvider.prototype, "ratePerKm", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: 'NGN' }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], LogisticsProvider.prototype, "maxWeightKg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProviderStatus, default: ProviderStatus.PENDING }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LogisticsProvider.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], LogisticsProvider.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], LogisticsProvider.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LogisticsProvider.prototype, "totalDeliveries", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LogisticsProvider.prototype, "totalRatings", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 200 }),
    __metadata("design:type", String)
], LogisticsProvider.prototype, "businessRegNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], LogisticsProvider.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LogisticsProvider.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LogisticsProvider.prototype, "updatedAt", void 0);
exports.LogisticsProvider = LogisticsProvider = __decorate([
    (0, typeorm_1.Entity)('logistics_providers'),
    (0, typeorm_1.Index)(['userId'], { unique: true })
], LogisticsProvider);
let LogisticsAgent = class LogisticsAgent {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, providerId: { required: true, type: () => String }, userId: { required: true, type: () => String }, name: { required: true, type: () => String }, phone: { required: true, type: () => String }, email: { required: true, type: () => String }, avatar: { required: true, type: () => String }, vehicleType: { required: true, enum: require("./logistics.entity").VehicleType }, vehicleNumber: { required: true, type: () => String }, coverageAreas: { required: true, type: () => [String] }, isAvailable: { required: true, type: () => Boolean }, isActive: { required: true, type: () => Boolean }, totalDeliveries: { required: true, type: () => Number }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.LogisticsAgent = LogisticsAgent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "providerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: VehicleType, default: VehicleType.MOTORCYCLE }),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "vehicleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], LogisticsAgent.prototype, "vehicleNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], LogisticsAgent.prototype, "coverageAreas", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], LogisticsAgent.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], LogisticsAgent.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LogisticsAgent.prototype, "totalDeliveries", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LogisticsAgent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LogisticsAgent.prototype, "updatedAt", void 0);
exports.LogisticsAgent = LogisticsAgent = __decorate([
    (0, typeorm_1.Entity)('logistics_agents'),
    (0, typeorm_1.Index)(['providerId'])
], LogisticsAgent);
let ShipmentAssignment = class ShipmentAssignment {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, orderId: { required: true, type: () => String }, sellerId: { required: true, type: () => String }, providerId: { required: true, type: () => String }, agentId: { required: true, type: () => String }, status: { required: true, enum: require("./logistics.entity").ShipmentStatus }, pickupAddress: { required: true, type: () => Object }, agreedRate: { required: true, type: () => Number }, currency: { required: true, type: () => String }, estimatedPickup: { required: true, type: () => Date }, estimatedDelivery: { required: true, type: () => Date }, actualPickup: { required: true, type: () => Date }, actualDelivery: { required: true, type: () => Date }, rejectionReason: { required: true, type: () => String }, proofOfDelivery: { required: true, type: () => String }, sellerNote: { required: true, type: () => String }, providerNote: { required: true, type: () => String }, statusHistory: { required: true, type: () => [Object] }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.ShipmentAssignment = ShipmentAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "providerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING }),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ShipmentAssignment.prototype, "pickupAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], ShipmentAssignment.prototype, "agreedRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: 'NGN' }),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ShipmentAssignment.prototype, "estimatedPickup", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ShipmentAssignment.prototype, "estimatedDelivery", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ShipmentAssignment.prototype, "actualPickup", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ShipmentAssignment.prototype, "actualDelivery", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "proofOfDelivery", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 1000 }),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "sellerNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 1000 }),
    __metadata("design:type", String)
], ShipmentAssignment.prototype, "providerNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], ShipmentAssignment.prototype, "statusHistory", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ShipmentAssignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ShipmentAssignment.prototype, "updatedAt", void 0);
exports.ShipmentAssignment = ShipmentAssignment = __decorate([
    (0, typeorm_1.Entity)('shipment_assignments'),
    (0, typeorm_1.Index)(['orderId'], { unique: true }),
    (0, typeorm_1.Index)(['providerId']),
    (0, typeorm_1.Index)(['sellerId'])
], ShipmentAssignment);
//# sourceMappingURL=logistics.entity.js.map