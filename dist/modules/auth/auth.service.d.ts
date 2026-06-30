import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    private readonly cfg;
    private readonly redis;
    private readonly notif;
    private readonly logger;
    constructor(userRepo: Repository<User>, jwtService: JwtService, cfg: ConfigService, redis: RedisService, notif: NotificationsService);
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    verifyEmail(email: string, otp: string): Promise<{
        message: string;
    }>;
    resendOtp(email: string): Promise<{
        message: string;
    }>;
    login(dto: LoginDto, ip?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Partial<User>;
    }>;
    googleLogin(googleUser: {
        email: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        googleId: string;
    }, ip?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Partial<User>;
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    generateTokens(user: User): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Partial<User>;
    }>;
    validateUser(email: string, password: string): Promise<User | null>;
}
