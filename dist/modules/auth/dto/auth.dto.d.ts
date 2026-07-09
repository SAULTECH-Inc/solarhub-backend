import { UserRole } from '../../users/user.entity';
export declare class RegisterDto {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class VerifyEmailDto {
    email: string;
    otp: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ResendOtpDto {
    email: string;
}
