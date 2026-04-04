import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsString, MinLength, MaxLength,
  IsOptional, IsEnum, Matches,
} from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @ApiProperty() @IsString() @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  lastName?: string;

  @ApiProperty() @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString() @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  password: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.BUYER })
  @IsOptional() @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty() @IsEmail()
  email: string;

  @ApiProperty() @IsString() @MinLength(1)
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty() @IsEmail()
  email: string;

  @ApiProperty() @IsString() @MinLength(6) @MaxLength(6)
  otp: string;
}

export class ForgotPasswordDto {
  @ApiProperty() @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty() @IsString()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString() @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString()
  oldPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString() @MinLength(8)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty() @IsString()
  refreshToken: string;
}

export class ResendOtpDto {
  @ApiProperty() @IsEmail()
  email: string;
}
