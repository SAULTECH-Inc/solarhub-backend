import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Engineer, EngineerStatus } from './engineer.entity';
import { User } from '../users/user.entity';
import { RedisService } from '../redis/redis.service';
import { paginate, paginationToSkipTake } from '../../common/utils/pagination.util';

export interface CreateEngineerDto {
  fullName: string;
  phone?: string;
  nin: string;
  ninData?: Record<string, any>;
  govtIdType: string;
  govtIdUrl?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm?: number;
  bio?: string;
  profilePhoto?: string;
  yearsOfExperience?: number;
  specializations?: string[];
  certifications?: Array<{ name: string; issuer: string; year?: number; url?: string }>;
  availableForHire?: boolean;
}

export interface EngineerFilters {
  city?: string;
  state?: string;
  specialization?: string;
  minRating?: number;
  availableOnly?: boolean;
  minYears?: number;
}

@Injectable()
export class EngineersService {
  constructor(
    @InjectRepository(Engineer) private readonly repo: Repository<Engineer>,
    @InjectRepository(User)     private readonly userRepo: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  // ── Create ─────────────────────────────────────────────────
  async createProfile(userId: string, dto: CreateEngineerDto): Promise<Engineer> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) throw new BadRequestException('You already have an engineer profile');

    // Validate required fields
    const required: (keyof CreateEngineerDto)[] = ['fullName', 'nin', 'govtIdType', 'address', 'city', 'state'];
    for (const field of required) {
      if (!dto[field]) throw new BadRequestException(`Field "${field}" is required`);
    }

    const engineer = this.repo.create({ ...dto, userId, status: EngineerStatus.ACTIVE });
    const saved = await this.repo.save(engineer);

    // Mark user as engineer and grant 30-day Free Trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    await this.userRepo.update(userId, { 
      isEngineer: true,
      subscriptionTier: 'pro_engineer',
      subscriptionStatus: 'trialing',
      trialEndsAt: trialEnd,
    });
    await this.redis.del(`user:${userId}`);

    return saved;
  }

  // ── Update ─────────────────────────────────────────────────
  async updateProfile(userId: string, dto: Partial<CreateEngineerDto>): Promise<Engineer> {
    const engineer = await this.getOwnProfile(userId);
    const forbidden = ['userId', 'id', 'status', 'averageRating', 'reviewCount', 'completedJobs', 'isVerified'];
    forbidden.forEach(k => delete dto[k]);
    Object.assign(engineer, dto);
    const saved = await this.repo.save(engineer);
    await this.redis.del(`engineer:${engineer.id}`);
    return saved;
  }

  // ── Read ───────────────────────────────────────────────────
  async getOwnProfile(userId: string): Promise<Engineer> {
    const e = await this.repo.findOne({ where: { userId }, relations: ['user'] });
    if (!e) throw new NotFoundException('Engineer profile not found');
    return e;
  }

  async getPublicProfile(id: string): Promise<Engineer> {
    return this.redis.cacheOrFetch(
      `engineer:${id}`,
      async () => {
        const e = await this.repo.findOne({
          where: { id, status: EngineerStatus.ACTIVE },
          relations: ['user'],
        });
        if (!e) throw new NotFoundException('Engineer not found');
        return e;
      },
      300,
    );
  }

  async search(filters: EngineerFilters, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const qb = this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.user', 'u')
      .where('e.status = :status', { status: EngineerStatus.ACTIVE });

    if (filters.city)         qb.andWhere('e.city ILIKE :city',   { city: `%${filters.city}%` });
    if (filters.state)        qb.andWhere('e.state ILIKE :state', { state: `%${filters.state}%` });
    if (filters.availableOnly) qb.andWhere('e.availableForHire = true');
    if (filters.minRating)    qb.andWhere('e.averageRating >= :mr', { mr: filters.minRating });
    if (filters.minYears)     qb.andWhere('e.yearsOfExperience >= :my', { my: filters.minYears });
    if (filters.specialization) {
      qb.andWhere('e.specializations::text ILIKE :spec', { spec: `%${filters.specialization}%` });
    }

    qb.skip(skip).take(take)
      .orderBy('e.isVerified', 'DESC')
      .addOrderBy('e.averageRating', 'DESC')
      .addOrderBy('e.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  // ── Rating update (called by reviews service) ──────────────
  async updateRating(engineerId: string, avg: number, count: number): Promise<void> {
    await this.repo.update(engineerId, { averageRating: avg, reviewCount: count });
    await this.redis.del(`engineer:${engineerId}`);
  }

  // ── Admin: flag / suspend / verify ────────────────────────
  async updateStatus(
    id: string,
    status: EngineerStatus,
    adminNote?: string,
  ): Promise<Engineer> {
    const engineer = await this.repo.findOne({ where: { id } });
    if (!engineer) throw new NotFoundException('Engineer not found');
    engineer.status    = status;
    engineer.adminNote = adminNote ?? engineer.adminNote;
    const saved = await this.repo.save(engineer);
    await this.redis.del(`engineer:${id}`);
    return saved;
  }

  async verifyEngineer(id: string): Promise<Engineer> {
    const engineer = await this.repo.findOne({ where: { id } });
    if (!engineer) throw new NotFoundException('Engineer not found');
    engineer.isVerified = true;
    engineer.verifiedAt = new Date();
    const saved = await this.repo.save(engineer);
    await this.redis.del(`engineer:${id}`);
    return saved;
  }

  async listAll(page: number, limit: number, filters: { status?: string; state?: string }) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const qb = this.repo.createQueryBuilder('e').leftJoinAndSelect('e.user', 'u');
    if (filters.status) qb.andWhere('e.status = :status', { status: filters.status });
    if (filters.state)  qb.andWhere('e.state ILIKE :state',  { state: `%${filters.state}%` });
    qb.skip(skip).take(take).orderBy('e.createdAt', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }
}
