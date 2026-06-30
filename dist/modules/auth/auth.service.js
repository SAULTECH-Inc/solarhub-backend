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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
const user_entity_1 = require("../users/user.entity");
const redis_service_1 = require("../redis/redis.service");
const notifications_service_1 = require("../notifications/notifications.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let AuthService = AuthService_1 = class AuthService {
    constructor(userRepo, jwtService, cfg, redis, notif) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.cfg = cfg;
        this.redis = redis;
        this.notif = notif;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        const exists = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
        if (exists)
            throw new common_1.ConflictException('Email already registered');
        const user = this.userRepo.create({
            ...dto,
            email: dto.email.toLowerCase(),
            role: dto.role || user_entity_1.UserRole.BUYER,
            status: user_entity_1.UserStatus.PENDING,
            emailVerified: false,
        });
        const saved = await this.userRepo.save(user);
        const otp = (0, pagination_util_1.generateOtp)();
        await this.redis.setOtp(saved.email, otp, 6000);
        await this.notif.sendEmailVerification(saved, otp);
        this.logger.log(`New user registered: ${saved.email} (${saved.role})`);
        return { message: 'Registration successful. Please verify your email.' };
    }
    async verifyEmail(email, otp) {
        const valid = await this.redis.verifyOtp(email.toLowerCase(), otp);
        if (!valid)
            throw new common_1.BadRequestException('Invalid or expired OTP');
        await this.userRepo.update({ email: email.toLowerCase() }, { emailVerified: true, status: user_entity_1.UserStatus.ACTIVE });
        const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
        await this.notif.sendWelcomeEmail(user);
        return { message: 'Email verified successfully' };
    }
    async resendOtp(email) {
        const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.emailVerified)
            throw new common_1.BadRequestException('Email already verified');
        const allowed = await this.redis.rateLimit(`otp_resend:${email}`, 3, 900);
        if (!allowed)
            throw new common_1.BadRequestException('Too many requests. Try again in 15 minutes.');
        const otp = (0, pagination_util_1.generateOtp)();
        await this.redis.setOtp(email, otp, 600);
        await this.notif.sendEmailVerification(user, otp);
        return { message: 'OTP resent' };
    }
    async login(dto, ip) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email.toLowerCase() },
            select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'emailVerified', 'password', 'provider', 'loginAttempts', 'lockoutUntil', 'notificationPrefs', 'avatar', 'sellerVerified'],
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (user.isLocked)
            throw new common_1.ForbiddenException('Account temporarily locked. Try again later.');
        if (user.provider !== user_entity_1.AuthProvider.LOCAL)
            throw new common_1.UnauthorizedException('This account uses ' + user.provider + ' sign-in. Please use that instead.');
        const valid = await user.comparePassword(dto.password);
        if (!valid) {
            const attempts = (user.loginAttempts || 0) + 1;
            const update = { loginAttempts: attempts };
            if (attempts >= 5) {
                update.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
                update.loginAttempts = 0;
            }
            await this.userRepo.update(user.id, update);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.emailVerified) {
            try {
                const otp = (0, pagination_util_1.generateOtp)();
                await this.redis.setOtp(user.email, otp, 600);
                await this.notif.sendEmailVerification(user, otp);
            }
            catch (e) {
                this.logger.warn(`Could not resend OTP to ${user.email}: ${e.message}`);
            }
            throw new common_1.HttpException({ statusCode: 403, requiresVerification: true, email: user.email, message: 'Please verify your email. A new OTP has been sent.' }, 403);
        }
        if (user.status === user_entity_1.UserStatus.SUSPENDED)
            throw new common_1.ForbiddenException('Account suspended. Contact support.');
        if (user.status !== user_entity_1.UserStatus.ACTIVE)
            throw new common_1.ForbiddenException('Account not active');
        await this.userRepo.update(user.id, {
            loginAttempts: 0,
            lockoutUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ip,
        });
        return this.generateTokens(user);
    }
    async googleLogin(googleUser, ip) {
        let user = await this.userRepo.findOne({
            where: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
        });
        if (!user) {
            user = await this.userRepo.save(this.userRepo.create({
                ...googleUser,
                provider: user_entity_1.AuthProvider.GOOGLE,
                emailVerified: true,
                status: user_entity_1.UserStatus.ACTIVE,
                role: user_entity_1.UserRole.BUYER,
            }));
            await this.notif.sendWelcomeEmail(user);
        }
        else {
            await this.userRepo.update(user.id, {
                googleId: googleUser.googleId,
                avatar: user.avatar || googleUser.avatar,
                lastLoginAt: new Date(),
                lastLoginIp: ip,
                status: user_entity_1.UserStatus.ACTIVE,
                emailVerified: true,
            });
        }
        return this.generateTokens(user);
    }
    async refreshToken(token) {
        let payload;
        try {
            payload = this.jwtService.verify(token, { secret: this.cfg.get('jwt.refreshSecret') });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.userRepo.findOne({
            where: { id: payload.sub },
            select: ['id', 'email', 'role', 'status', 'refreshToken'],
        });
        if (!user || !user.refreshToken)
            throw new common_1.UnauthorizedException('Session expired');
        const valid = await bcrypt.compare(token, user.refreshToken);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        const tokens = await this.generateTokens(user);
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
    async logout(userId) {
        await this.userRepo.update(userId, { refreshToken: null, refreshTokenExpiry: null });
        await this.redis.invalidateAllSessions(userId);
        return { message: 'Logged out successfully' };
    }
    async forgotPassword(email) {
        const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
        if (!user)
            return { message: 'If your email exists, a reset link has been sent.' };
        const token = (0, uuid_1.v4)();
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await this.userRepo.update(user.id, { passwordResetToken: token, passwordResetExpiry: expiry });
        await this.notif.sendPasswordReset(user, token);
        return { message: 'If your email exists, a reset link has been sent.' };
    }
    async resetPassword(token, newPassword) {
        const user = await this.userRepo.findOne({
            where: { passwordResetToken: token },
        });
        if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        await this.userRepo.update(user.id, {
            password: await bcrypt.hash(newPassword, 12),
            passwordResetToken: null,
            passwordResetExpiry: null,
        });
        await this.redis.invalidateAllSessions(user.id);
        await this.notif.sendPasswordChanged(user);
        return { message: 'Password reset successful' };
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'password'] });
        const valid = await user.comparePassword(oldPassword);
        if (!valid)
            throw new common_1.BadRequestException('Current password is incorrect');
        await this.userRepo.update(userId, { password: await bcrypt.hash(newPassword, 12) });
        await this.redis.invalidateAllSessions(userId);
        return { message: 'Password changed successfully' };
    }
    async generateTokens(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.cfg.get('jwt.secret'),
                expiresIn: this.cfg.get('jwt.expiresIn', '15m'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.cfg.get('jwt.refreshSecret'),
                expiresIn: this.cfg.get('jwt.refreshExpiresIn', '30d'),
            }),
        ]);
        const hashed = await bcrypt.hash(refreshToken, 10);
        const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.userRepo.update(user.id, { refreshToken: hashed, refreshTokenExpiry: expiry });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id, email: user.email,
                firstName: user.firstName, lastName: user.lastName,
                role: user.role, avatar: user.avatar,
                sellerVerified: user.sellerVerified,
            },
        };
    }
    async validateUser(email, password) {
        const user = await this.userRepo.findOne({
            where: { email: email.toLowerCase() },
            select: ['id', 'email', 'password', 'role', 'status', 'emailVerified'],
        });
        if (!user)
            return null;
        const valid = await user.comparePassword(password);
        return valid ? user : null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map