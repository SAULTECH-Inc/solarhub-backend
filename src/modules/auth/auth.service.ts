import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, NotFoundException, ForbiddenException, HttpException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { User, UserRole, AuthProvider, UserStatus } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { generateOtp } from '../../common/utils/pagination.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly cfg: ConfigService,
    private readonly redis: RedisService,
    private readonly notif: NotificationsService,
  ) {}

  // ── Registration ──────────────────────────────────────────
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const exists = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('Email already registered');

    const user = this.userRepo.create({
      ...dto,
      email: dto.email.toLowerCase(),
      role: dto.role || UserRole.BUYER,
      status: UserStatus.PENDING,
      emailVerified: false,
    });
    const saved = await this.userRepo.save(user);

    // Send verification email
    const otp = generateOtp();
    await this.redis.setOtp(saved.email, otp, 6000);
    await this.notif.sendEmailVerification(saved, otp);

    this.logger.log(`New user registered: ${saved.email} (${saved.role})`);
    return { message: 'Registration successful. Please verify your email.' };
  }

  // ── Email verification ────────────────────────────────────
  async verifyEmail(email: string, otp: string): Promise<{ message: string }> {
    const valid = await this.redis.verifyOtp(email.toLowerCase(), otp);
    if (!valid) throw new BadRequestException('Invalid or expired OTP');

    await this.userRepo.update(
      { email: email.toLowerCase() },
      { emailVerified: true, status: UserStatus.ACTIVE },
    );
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    await this.notif.sendWelcomeEmail(user);
    return { message: 'Email verified successfully' };
  }

  // ── Resend OTP ────────────────────────────────────────────
  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    // Rate limit: max 3 resends per 15 min
    const allowed = await this.redis.rateLimit(`otp_resend:${email}`, 3, 900);
    if (!allowed) throw new BadRequestException('Too many requests. Try again in 15 minutes.');

    const otp = generateOtp();
    await this.redis.setOtp(email, otp, 600);
    await this.notif.sendEmailVerification(user, otp);
    return { message: 'OTP resent' };
  }

  // ── Login ─────────────────────────────────────────────────
  async login(dto: LoginDto, ip?: string): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      select: ['id','email','firstName','lastName','role','status','emailVerified','password','provider','loginAttempts','lockoutUntil','notificationPrefs','avatar','sellerVerified'],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isLocked) throw new ForbiddenException('Account temporarily locked. Try again later.');
    if (user.provider !== AuthProvider.LOCAL) throw new UnauthorizedException('This account uses ' + user.provider + ' sign-in. Please use that instead.');

    const valid = await user.comparePassword(dto.password);
    if (!valid) {
      const attempts = (user.loginAttempts || 0) + 1;
      const update: Partial<User> = { loginAttempts: attempts };
      if (attempts >= 5) {
        update.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        update.loginAttempts = 0;
      }
      await this.userRepo.update(user.id, update);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      // Best-effort OTP resend — don't let errors block the response
      try {
        const otp = generateOtp();
        await this.redis.setOtp(user.email, otp, 600);
        await this.notif.sendEmailVerification(user, otp);
      } catch (e) {
        this.logger.warn(`Could not resend OTP to ${user.email}: ${e.message}`);
      }
      throw new HttpException(
        { statusCode: 403, requiresVerification: true, email: user.email, message: 'Please verify your email. A new OTP has been sent.' },
        403,
      );
    }
    if (user.status === UserStatus.SUSPENDED) throw new ForbiddenException('Account suspended. Contact support.');
    if (user.status !== UserStatus.ACTIVE) throw new ForbiddenException('Account not active');

    // Reset login attempts
    await this.userRepo.update(user.id, {
      loginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    return this.generateTokens(user);
  }

  // ── Google OAuth ──────────────────────────────────────────
  async googleLogin(googleUser: {
    email: string; firstName: string; lastName: string;
    avatar?: string; googleId: string;
  }, ip?: string): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    let user = await this.userRepo.findOne({
      where: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
    });

    if (!user) {
      user = await this.userRepo.save(
        this.userRepo.create({
          ...googleUser,
          provider: AuthProvider.GOOGLE,
          emailVerified: true,
          status: UserStatus.ACTIVE,
          role: UserRole.BUYER,
        }),
      );
      await this.notif.sendWelcomeEmail(user);
    } else {
      await this.userRepo.update(user.id, {
        googleId: googleUser.googleId,
        avatar: user.avatar || googleUser.avatar,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });
    }

    return this.generateTokens(user);
  }

  // ── Refresh token ─────────────────────────────────────────
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret: this.cfg.get('jwt.refreshSecret') });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: ['id','email','role','status','refreshToken'],
    });
    if (!user || !user.refreshToken) throw new UnauthorizedException('Session expired');

    const valid = await bcrypt.compare(token, user.refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    // Invalidate old and issue new
    const tokens = await this.generateTokens(user);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(userId: string): Promise<{ message: string }> {
    await this.userRepo.update(userId, { refreshToken: null, refreshTokenExpiry: null });
    await this.redis.invalidateAllSessions(userId);
    return { message: 'Logged out successfully' };
  }

  // ── Forgot/Reset password ─────────────────────────────────
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase() } });
    // Always respond same to prevent enumeration
    if (!user) return { message: 'If your email exists, a reset link has been sent.' };

    const token = uuid();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepo.update(user.id, { passwordResetToken: token, passwordResetExpiry: expiry });
    await this.notif.sendPasswordReset(user, token);
    return { message: 'If your email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { passwordResetToken: token },
    });
    if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      throw new BadRequestException('Invalid or expired reset token');
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

  // ── Change password ───────────────────────────────────────
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id','password'] });
    const valid = await user.comparePassword(oldPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    await this.userRepo.update(userId, { password: await bcrypt.hash(newPassword, 12) });
    await this.redis.invalidateAllSessions(userId);
    return { message: 'Password changed successfully' };
  }

  // ── Token generation ──────────────────────────────────────
  async generateTokens(user: User): Promise<{
    accessToken: string; refreshToken: string; user: Partial<User>
  }> {
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

    // Store hashed refresh token
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

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
      select: ['id','email','password','role','status','emailVerified'],
    });
    if (!user) return null;
    const valid = await user.comparePassword(password);
    return valid ? user : null;
  }
}
