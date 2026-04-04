import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rfq, RfqBid, RfqStatus, BidStatus } from './rfq.entity';
import { User } from '../users/user.entity';
import { paginate, paginationToSkipTake } from '../../common/utils/pagination.util';

@Injectable()
export class RfqsService {
  constructor(
    @InjectRepository(Rfq) private readonly rfqRepo: Repository<Rfq>,
    @InjectRepository(RfqBid) private readonly bidRepo: Repository<RfqBid>,
  ) {}

  // ── BUYER FUNCTIONS ────────────────────────────────────────

  async createRfq(userId: string, dto: Partial<Rfq>): Promise<Rfq> {
    const rfq = this.rfqRepo.create({
      ...dto,
      userId,
      status: RfqStatus.OPEN,
    });
    return this.rfqRepo.save(rfq);
  }

  async getMyRfqs(userId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.rfqRepo.findAndCount({
      where: { userId },
      relations: ['bids', 'bids.contractor'],
      order: { createdAt: 'DESC' },
      skip, take,
    });
    return paginate(data, total, page, limit);
  }

  async acceptBid(userId: string, bidId: string): Promise<RfqBid> {
    const bid = await this.bidRepo.findOne({ where: { id: bidId }, relations: ['rfq'] });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.rfq.userId !== userId) throw new ForbiddenException('Not your RFQ');
    if (bid.rfq.status !== RfqStatus.OPEN && bid.rfq.status !== RfqStatus.REVIEWING) {
      throw new BadRequestException('RFQ is no longer open');
    }

    // Accept this bid
    bid.status = BidStatus.ACCEPTED;
    await this.bidRepo.save(bid);

    // Reject all other bids
    await this.bidRepo.update(
      { rfqId: bid.rfqId, status: BidStatus.PENDING },
      { status: BidStatus.REJECTED }
    );

    // Update RFQ status
    bid.rfq.status = RfqStatus.AWARDED;
    await this.rfqRepo.save(bid.rfq);

    return bid;
  }

  // ── CONTRACTOR FUNCTIONS ───────────────────────────────────

  async getOpenRfqs(state?: string, city?: string, page: number = 1, limit: number = 20) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const qb = this.rfqRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .where('r.status = :status', { status: RfqStatus.OPEN });

    if (state) qb.andWhere('r.state ILIKE :state', { state: `%${state}%` });
    if (city) qb.andWhere('r.city ILIKE :city', { city: `%${city}%` });

    qb.skip(skip).take(take).orderBy('r.createdAt', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async submitBid(contractor: User, rfqId: string, dto: Partial<RfqBid>): Promise<RfqBid> {
    if (!contractor.isEngineer && !contractor.isSeller) {
      throw new ForbiddenException('Only verified professionals can submit bids');
    }

    const rfq = await this.rfqRepo.findOne({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== RfqStatus.OPEN) throw new BadRequestException('RFQ is not open for bidding');

    // Check if already bid
    const existing = await this.bidRepo.findOne({ where: { rfqId, contractorId: contractor.id } });
    if (existing) throw new BadRequestException('You have already submitted a quote for this project');

    const bid = this.bidRepo.create({
      ...dto,
      rfqId,
      contractorId: contractor.id,
      status: BidStatus.PENDING,
    });
    
    await this.bidRepo.save(bid);

    // Update RFQ count
    await this.rfqRepo.increment({ id: rfqId }, 'bidCount', 1);

    return bid;
  }
}
