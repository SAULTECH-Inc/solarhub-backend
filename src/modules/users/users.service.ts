import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User, UserRole, UserStatus } from './user.entity';
import { RedisService } from '../redis/redis.service';
import { paginate, paginationToSkipTake } from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  async updateProfile(userId: string, dto: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    const forbidden = ['id','email','role','password','status','emailVerified','provider','googleId','refreshToken'];
    forbidden.forEach(k => delete dto[k]);
    Object.assign(user, dto);
    const saved = await this.repo.save(user);
    await this.redis.del(`user:${userId}`);
    return saved;
  }

  async getProfile(userId: string): Promise<User> {
    return this.redis.cacheOrFetch(
      `user:${userId}`,
      () => this.findById(userId),
      300,
    );
  }

  // ── Address book ──────────────────────────────────────────
  async addAddress(userId: string, address: Omit<User['addresses'][0], 'id'>): Promise<User> {
    const user = await this.findById(userId);
    const newAddr = { ...address, id: uuid() };
    if (address.isDefault || !user.addresses.length) {
      user.addresses = user.addresses.map(a => ({ ...a, isDefault: false }));
    }
    user.addresses.push(newAddr);
    return this.repo.save(user);
  }

  async updateAddress(userId: string, addrId: string, update: Partial<User['addresses'][0]>): Promise<User> {
    const user = await this.findById(userId);
    const idx = user.addresses.findIndex(a => a.id === addrId);
    if (idx === -1) throw new NotFoundException('Address not found');
    if (update.isDefault) user.addresses = user.addresses.map(a => ({ ...a, isDefault: false }));
    user.addresses[idx] = { ...user.addresses[idx], ...update, id: addrId };
    return this.repo.save(user);
  }

  async deleteAddress(userId: string, addrId: string): Promise<User> {
    const user = await this.findById(userId);
    user.addresses = user.addresses.filter(a => a.id !== addrId);
    return this.repo.save(user);
  }

  // ── Seller onboarding ─────────────────────────────────────
  async becomeSeller(userId: string, dto: {
    storeName: string;
    storeDescription?: string;
    storeAddress: string;
    storeCity: string;
    storeState: string;
    storeLatitude?: number;
    storeLongitude?: number;
    businessType?: string;
    businessRegNumber: string;
    nin: string;
    ninData?: Record<string, any>;
    govtIdType: string;
    govtIdUrl?: string;
    taxId?: string;
    storeBanner?: string;
  }): Promise<User> {
    const user = await this.findById(userId);
    // Validate required KYC fields
    const required: string[] = ['storeName', 'storeAddress', 'storeCity', 'storeState', 'businessRegNumber', 'nin', 'govtIdType'];
    for (const field of required) {
      if (!dto[field]) throw new BadRequestException(`Field "${field}" is required to become a seller`);
    }
    // Setup 30-day Free Trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    Object.assign(user, {
      ...dto,
      isSeller: true,
      sellerProfileComplete: true,
      status: UserStatus.ACTIVE,
      subscriptionTier: 'pro_seller',
      subscriptionStatus: 'trialing',
      trialEndsAt: trialEnd,
    });
    const saved = await this.repo.save(user);
    await this.redis.del(`user:${userId}`);
    return saved;
  }

  async updateSellerProfile(userId: string, dto: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    if (!user.isSeller) throw new BadRequestException('Not a seller account');
    const allowed = [
      'storeName','storeDescription','storeBanner','storeAddress',
      'storeCity','storeState','storeLatitude','storeLongitude',
      'businessType','businessRegNumber','taxId','nin','ninData','govtIdType','govtIdUrl',
    ];
    allowed.forEach(k => { if ((dto as any)[k] !== undefined) (user as any)[k] = (dto as any)[k]; });
    const saved = await this.repo.save(user);
    await this.redis.del(`user:${userId}`);
    return saved;
  }

  // ── Admin ─────────────────────────────────────────────────
  async listAll(page: number, limit: number, filters: { role?: string; status?: string; search?: string }) {
    const qb = this.repo.createQueryBuilder('u');
    if (filters.role === 'seller')   qb.andWhere('u.isSeller = true');
    else if (filters.role === 'engineer') qb.andWhere('u.isEngineer = true');
    else if (filters.role)           qb.andWhere('u.role = :role', { role: filters.role });
    if (filters.status) qb.andWhere('u.status = :status', { status: filters.status });
    if (filters.search) qb.andWhere('(u.email ILIKE :q OR u.firstName ILIKE :q)', { q: `%${filters.search}%` });
    qb.skip((page - 1) * limit).take(limit).orderBy('u.createdAt', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async updateStatus(userId: string, status: UserStatus): Promise<User> {
    await this.repo.update(userId, { status });
    return this.findById(userId);
  }

  async getStats() {
    const [total, sellers, engineers, buyers, admins] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { isSeller: true } }),
      this.repo.count({ where: { isEngineer: true } }),
      this.repo.count({ where: { role: UserRole.BUYER } }),
      this.repo.count({ where: { role: UserRole.ADMIN } }),
    ]);
    return { total, sellers, engineers, buyers, admins };
  }
}
