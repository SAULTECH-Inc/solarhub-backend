import { IsString, IsOptional, IsNumberString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterBankAccountDto {
  @ApiProperty({ example: '044' })
  @IsString()
  bankCode: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  accountNumber: string;
}

export class SellerRespondDto {
  @ApiProperty({ enum: ['accept', 'decline'] })
  @IsIn(['accept', 'decline'])
  decision: 'accept' | 'decline';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class FundEscrowDto {
  @ApiProperty({ example: 'NGN' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'buyer@email.com' })
  @IsString()
  email: string;
}

export class MarkShippedDto {
  @ApiPropertyOptional({ example: 'DHL' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ example: '1Z999AA10123456784' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class RaiseDisputeDto {
  @ApiProperty({ example: 'Item arrived damaged' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: ['https://cloudinary.com/evidence1.jpg'] })
  @IsOptional()
  evidence?: string[];
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['release', 'refund'] })
  @IsIn(['release', 'refund'])
  decision: 'release' | 'refund';

  @ApiProperty()
  @IsString()
  note: string;
}
