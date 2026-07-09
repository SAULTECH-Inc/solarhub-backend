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
exports.QueryShipmentsDto = exports.QueryProvidersDto = exports.AssignAgentDto = exports.RejectShipmentDto = exports.UpdateShipmentStatusDto = exports.AssignShipmentDto = exports.PickupAddressDto = exports.AddAgentDto = exports.RegisterProviderDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const logistics_entity_1 = require("./logistics.entity");
class RegisterProviderDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, enum: require("./logistics.entity").ProviderType }, name: { required: true, type: () => String, maxLength: 200 }, description: { required: false, type: () => String, maxLength: 1000 }, phone: { required: true, type: () => String, maxLength: 20 }, email: { required: true, type: () => String }, address: { required: false, type: () => String, maxLength: 300 }, city: { required: false, type: () => String, maxLength: 100 }, state: { required: false, type: () => String, maxLength: 100 }, coverageStates: { required: true, type: () => [String] }, coverageCities: { required: true, type: () => [String] }, vehicleTypes: { required: true, type: () => [String] }, baseRate: { required: true, type: () => Number, minimum: 0 }, ratePerKm: { required: false, type: () => Number, minimum: 0 }, currency: { required: false, type: () => String, maxLength: 3 }, maxWeightKg: { required: false, type: () => Number, minimum: 0 }, businessRegNumber: { required: false, type: () => String, maxLength: 200 }, logo: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.RegisterProviderDto = RegisterProviderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: logistics_entity_1.ProviderType }),
    (0, class_validator_1.IsEnum)(logistics_entity_1.ProviderType),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: 200 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: 20 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegisterProviderDto.prototype, "coverageStates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegisterProviderDto.prototype, "coverageCities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegisterProviderDto.prototype, "vehicleTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegisterProviderDto.prototype, "baseRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegisterProviderDto.prototype, "ratePerKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'NGN' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegisterProviderDto.prototype, "maxWeightKg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "businessRegNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RegisterProviderDto.prototype, "logo", void 0);
class AddAgentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, maxLength: 200 }, phone: { required: true, type: () => String, maxLength: 20 }, email: { required: false, type: () => String }, vehicleType: { required: true, enum: require("./logistics.entity").VehicleType }, vehicleNumber: { required: false, type: () => String, maxLength: 50 }, coverageAreas: { required: true, type: () => [String] }, avatar: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.AddAgentDto = AddAgentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], AddAgentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], AddAgentDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AddAgentDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: logistics_entity_1.VehicleType }),
    (0, class_validator_1.IsEnum)(logistics_entity_1.VehicleType),
    __metadata("design:type", String)
], AddAgentDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], AddAgentDto.prototype, "vehicleNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AddAgentDto.prototype, "coverageAreas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AddAgentDto.prototype, "avatar", void 0);
class PickupAddressDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { address: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, phone: { required: true, type: () => String }, contactName: { required: true, type: () => String } };
    }
}
exports.PickupAddressDto = PickupAddressDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PickupAddressDto.prototype, "contactName", void 0);
class AssignShipmentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { orderId: { required: true, type: () => String }, providerId: { required: true, type: () => String }, pickupAddress: { required: true, type: () => require("./logistics.dto").PickupAddressDto }, agreedRate: { required: true, type: () => Number, minimum: 0 }, currency: { required: false, type: () => String, maxLength: 3 }, sellerNote: { required: false, type: () => String, maxLength: 1000 }, estimatedPickup: { required: false, type: () => String } };
    }
}
exports.AssignShipmentDto = AssignShipmentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignShipmentDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignShipmentDto.prototype, "providerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: PickupAddressDto }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", PickupAddressDto)
], AssignShipmentDto.prototype, "pickupAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AssignShipmentDto.prototype, "agreedRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'NGN' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3),
    __metadata("design:type", String)
], AssignShipmentDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], AssignShipmentDto.prototype, "sellerNote", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AssignShipmentDto.prototype, "estimatedPickup", void 0);
class UpdateShipmentStatusDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: require("./logistics.entity").ShipmentStatus }, note: { required: false, type: () => String, maxLength: 500 }, location: { required: false, type: () => String, maxLength: 200 }, proofOfDelivery: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.UpdateShipmentStatusDto = UpdateShipmentStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: logistics_entity_1.ShipmentStatus }),
    (0, class_validator_1.IsEnum)(logistics_entity_1.ShipmentStatus),
    __metadata("design:type", String)
], UpdateShipmentStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateShipmentStatusDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateShipmentStatusDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateShipmentStatusDto.prototype, "proofOfDelivery", void 0);
class RejectShipmentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, maxLength: 500 } };
    }
}
exports.RejectShipmentDto = RejectShipmentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RejectShipmentDto.prototype, "reason", void 0);
class AssignAgentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { agentId: { required: true, type: () => String } };
    }
}
exports.AssignAgentDto = AssignAgentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignAgentDto.prototype, "agentId", void 0);
class QueryProvidersDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { state: { required: false, type: () => String }, city: { required: false, type: () => String }, type: { required: false, enum: require("./logistics.entity").ProviderType }, vehicleType: { required: false, type: () => String }, page: { required: false, type: () => Number }, limit: { required: false, type: () => Number } };
    }
}
exports.QueryProvidersDto = QueryProvidersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryProvidersDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryProvidersDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: logistics_entity_1.ProviderType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(logistics_entity_1.ProviderType),
    __metadata("design:type", String)
], QueryProvidersDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryProvidersDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryProvidersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryProvidersDto.prototype, "limit", void 0);
class QueryShipmentsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, enum: require("./logistics.entity").ShipmentStatus } };
    }
}
exports.QueryShipmentsDto = QueryShipmentsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: logistics_entity_1.ShipmentStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(logistics_entity_1.ShipmentStatus),
    __metadata("design:type", String)
], QueryShipmentsDto.prototype, "status", void 0);
//# sourceMappingURL=logistics.dto.js.map