import {
  IsString, IsEnum, IsEmail, IsOptional, IsArray, IsNumber,
  IsBoolean, IsUUID, IsObject, IsDateString, MaxLength, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderType, VehicleType, ShipmentStatus } from './logistics.entity';

// ── RegisterProviderDto ───────────────────────────────────────────────────────

export class RegisterProviderDto {
  @ApiProperty({ enum: ProviderType })
  @IsEnum(ProviderType)
  type: ProviderType;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  coverageStates: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  coverageCities: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  vehicleTypes: string[];

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  ratePerKm?: number;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessRegNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;
}

// ── AddAgentDto ───────────────────────────────────────────────────────────────

export class AddAgentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleNumber?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  coverageAreas: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;
}

// ── AssignShipmentDto ─────────────────────────────────────────────────────────

export class PickupAddressDto {
  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  contactName: string;
}

export class AssignShipmentDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty()
  @IsUUID()
  providerId: string;

  @ApiProperty({ type: PickupAddressDto })
  @IsObject()
  pickupAddress: PickupAddressDto;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  agreedRate: number;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sellerNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  estimatedPickup?: string;
}

// ── UpdateShipmentStatusDto ───────────────────────────────────────────────────

export class UpdateShipmentStatusDto {
  @ApiProperty({ enum: ShipmentStatus })
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  proofOfDelivery?: string;
}

// ── RejectShipmentDto ─────────────────────────────────────────────────────────

export class RejectShipmentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason: string;
}

// ── AssignAgentDto ────────────────────────────────────────────────────────────

export class AssignAgentDto {
  @ApiProperty()
  @IsUUID()
  agentId: string;
}

// ── QueryProvidersDto ─────────────────────────────────────────────────────────

export class QueryProvidersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: ProviderType })
  @IsOptional()
  @IsEnum(ProviderType)
  type?: ProviderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

// ── QueryShipmentsDto ─────────────────────────────────────────────────────────

export class QueryShipmentsDto {
  @ApiPropertyOptional({ enum: ShipmentStatus })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;
}
