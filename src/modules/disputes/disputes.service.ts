import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Dispute, DisputeStatus, DisputeResolution, DisputePriority,
  DisputeType, DisputeCategory,
} from './dispute.entity';
import { paginate, paginationToSkipTake } from '@common/utils/pagination.util';

export interface CreateDisputeDto {
  type: DisputeType;
  category: DisputeCategory;
  subject: string;
  description: string;
  orderId?: string;
  paymentId?: string;
  productId?: string;
  respondentId?: string;
  amountDisputed?: number;
  evidence?: string[];
}

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute) private readonly repo: Repository<Dispute>,
  ) {}

  // ── User-facing ────────────────────────────────────────────────────────────

  async create(claimantId: string, dto: CreateDisputeDto): Promise<Dispute> {
    const dispute = this.repo.create({ ...dto, claimantId } as Dispute);
    return this.repo.save(dispute);
  }

  async getMyDisputes(userId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where: { claimantId: userId },
      order: { createdAt: 'DESC' },
      skip, take,
    });
    return paginate(data, total, page, limit);
  }

  async getById(id: string, userId?: string): Promise<Dispute> {
    const d = await this.repo.findOne({
      where: { id },
      relations: ['claimant', 'respondent', 'assignedTo'],
    });
    if (!d) throw new NotFoundException('Dispute not found');
    if (userId && d.claimantId !== userId && d.respondentId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return d;
  }

  async addResponse(id: string, userId: string, response: string): Promise<Dispute> {
    const d = await this.getById(id, userId);
    d.respondentResponse = response;
    if (d.status === DisputeStatus.AWAITING_RESPONSE) d.status = DisputeStatus.UNDER_REVIEW;
    return this.repo.save(d);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async adminListAll(page: number, limit: number, filters: {
    status?: string; type?: string; priority?: string; search?: string;
  }) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const qb = this.repo.createQueryBuilder('d')
      .leftJoinAndSelect('d.claimant', 'claimant')
      .leftJoinAndSelect('d.respondent', 'respondent')
      .leftJoinAndSelect('d.assignedTo', 'assignedTo')
      .orderBy('d.createdAt', 'DESC')
      .skip(skip).take(take);

    if (filters.status)   qb.andWhere('d.status = :status', { status: filters.status });
    if (filters.type)     qb.andWhere('d.type = :type',     { type: filters.type });
    if (filters.priority) qb.andWhere('d.priority = :priority', { priority: filters.priority });
    if (filters.search) {
      qb.andWhere(
        `(claimant."firstName" ILIKE :s OR claimant.email ILIKE :s OR d.subject ILIKE :s)`,
        { s: `%${filters.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async adminGetById(id: string): Promise<Dispute> {
    const d = await this.repo.findOne({
      where: { id },
      relations: ['claimant', 'respondent', 'assignedTo'],
    });
    if (!d) throw new NotFoundException('Dispute not found');
    return d;
  }

  async adminUpdateStatus(
    id: string,
    status: DisputeStatus,
    adminNote?: string,
    assignedToId?: string,
  ): Promise<Dispute> {
    const d = await this.adminGetById(id);
    d.status = status;
    if (adminNote)    d.adminNote    = adminNote;
    if (assignedToId) d.assignedToId = assignedToId;
    if (status === DisputeStatus.AWAITING_RESPONSE) {
      d.respondentDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }
    return this.repo.save(d);
  }

  async adminResolve(
    id: string,
    resolution: DisputeResolution,
    resolutionNote: string,
  ): Promise<Dispute> {
    const d = await this.adminGetById(id);
    d.status        = DisputeStatus.RESOLVED;
    d.resolution    = resolution;
    d.resolutionNote = resolutionNote;
    d.resolvedAt    = new Date();
    return this.repo.save(d);
  }

  async adminSetPriority(id: string, priority: DisputePriority): Promise<Dispute> {
    const d = await this.adminGetById(id);
    d.priority = priority;
    return this.repo.save(d);
  }

  async getStats() {
    const [total, open, underReview, awaitingResponse, resolved, escalated, closed] =
      await Promise.all([
        this.repo.count(),
        this.repo.count({ where: { status: DisputeStatus.OPEN } }),
        this.repo.count({ where: { status: DisputeStatus.UNDER_REVIEW } }),
        this.repo.count({ where: { status: DisputeStatus.AWAITING_RESPONSE } }),
        this.repo.count({ where: { status: DisputeStatus.RESOLVED } }),
        this.repo.count({ where: { status: DisputeStatus.ESCALATED } }),
        this.repo.count({ where: { status: DisputeStatus.CLOSED } }),
      ]);
    return { total, open, underReview, awaitingResponse, resolved, escalated, closed };
  }
}
