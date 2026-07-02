import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LogisticsProvider, LogisticsAgent, ShipmentAssignment,
  ProviderType, ProviderStatus, ShipmentStatus,
  StatusHistoryEntry,
} from './logistics.entity';
import {
  RegisterProviderDto, AddAgentDto, AssignShipmentDto,
  UpdateShipmentStatusDto, RejectShipmentDto,
  AssignAgentDto, QueryProvidersDto,
} from './logistics.dto';
import { User } from '../users/user.entity';
import { DeliveryTracking, TrackingEventType } from '../delivery/delivery.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

// Ordered list of valid status progressions (cannot go backward)
const STATUS_ORDER: ShipmentStatus[] = [
  ShipmentStatus.PENDING,
  ShipmentStatus.ACCEPTED,
  ShipmentStatus.PICKED_UP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.DELIVERED,
];

// Map shipment status → delivery tracking event
const SHIPMENT_TO_TRACKING: Partial<Record<ShipmentStatus, TrackingEventType>> = {
  [ShipmentStatus.PICKED_UP]:  TrackingEventType.DISPATCHED,
  [ShipmentStatus.IN_TRANSIT]: TrackingEventType.IN_TRANSIT,
  [ShipmentStatus.DELIVERED]:  TrackingEventType.DELIVERED,
  [ShipmentStatus.FAILED]:     TrackingEventType.FAILED_DELIVERY,
};

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    @InjectRepository(LogisticsProvider)
    private readonly providerRepo: Repository<LogisticsProvider>,

    @InjectRepository(LogisticsAgent)
    private readonly agentRepo: Repository<LogisticsAgent>,

    @InjectRepository(ShipmentAssignment)
    private readonly shipmentRepo: Repository<ShipmentAssignment>,

    @InjectRepository(DeliveryTracking)
    private readonly trackingRepo: Repository<DeliveryTracking>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly notif: NotificationsService,
  ) {}

  // ── Provider Registration ─────────────────────────────────────────────────

  async register(userId: string, dto: RegisterProviderDto): Promise<LogisticsProvider> {
    const existing = await this.providerRepo.findOne({ where: { userId } });
    if (existing) {
      throw new BadRequestException('You already have a logistics provider profile');
    }

    const provider = this.providerRepo.create({
      ...dto,
      userId,
      status: ProviderStatus.PENDING,
    });
    const saved = await this.providerRepo.save(provider);

    await this.userRepo.update(userId, { isLogistics: true } as any);

    this.logger.log(`Logistics provider registered: ${saved.id} by user ${userId}`);
    return saved;
  }

  async getMyProfile(userId: string): Promise<LogisticsProvider> {
    const provider = await this.providerRepo.findOne({ where: { userId } });
    if (!provider) throw new NotFoundException('Logistics provider profile not found');
    return provider;
  }

  async updateProfile(
    userId: string,
    dto: Partial<RegisterProviderDto>,
  ): Promise<LogisticsProvider> {
    const provider = await this.getMyProfile(userId);

    // Guard against overwriting immutable fields
    const immutable = ['id', 'userId', 'status', 'isVerified', 'rating', 'totalDeliveries', 'totalRatings'];
    immutable.forEach(k => delete (dto as any)[k]);

    Object.assign(provider, dto);
    return this.providerRepo.save(provider);
  }

  // ── Public Provider Listing ───────────────────────────────────────────────

  async listProviders(
    query: QueryProvidersDto,
  ): Promise<{ data: LogisticsProvider[]; total: number }> {
    const page  = Math.max(1, query.page  ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const skip  = (page - 1) * limit;

    const qb = this.providerRepo.createQueryBuilder('p')
      .where('p.status = :status',      { status: ProviderStatus.ACTIVE })
      .andWhere('p.isAvailable = true');

    if (query.state) {
      qb.andWhere('p.coverageStates::jsonb @> :state::jsonb', {
        state: JSON.stringify([query.state]),
      });
    }
    if (query.city) {
      qb.andWhere('p.coverageCities::jsonb @> :city::jsonb', {
        city: JSON.stringify([query.city]),
      });
    }
    if (query.type) {
      qb.andWhere('p.type = :type', { type: query.type });
    }
    if (query.vehicleType) {
      qb.andWhere('p.vehicleTypes::jsonb @> :vt::jsonb', {
        vt: JSON.stringify([query.vehicleType]),
      });
    }

    qb.orderBy('p.isVerified', 'DESC')
      .addOrderBy('p.rating', 'DESC')
      .addOrderBy('p.totalDeliveries', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getProvider(
    id: string,
  ): Promise<LogisticsProvider & { agents?: LogisticsAgent[] }> {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Logistics provider not found');

    let agents: LogisticsAgent[] | undefined;
    if (provider.type === ProviderType.COMPANY) {
      agents = await this.agentRepo.find({
        where: { providerId: provider.id, isActive: true },
        order: { createdAt: 'DESC' },
      });
    }

    return { ...provider, agents };
  }

  // ── Agent Management ──────────────────────────────────────────────────────

  async addAgent(userId: string, dto: AddAgentDto): Promise<LogisticsAgent> {
    const provider = await this.getMyProfile(userId);

    if (provider.type !== ProviderType.COMPANY) {
      throw new BadRequestException(
        'Only company providers can manage agents. Individual providers operate themselves.',
      );
    }

    const agent = this.agentRepo.create({ ...dto, providerId: provider.id });
    return this.agentRepo.save(agent);
  }

  async getMyAgents(userId: string): Promise<LogisticsAgent[]> {
    const provider = await this.getMyProfile(userId);
    return this.agentRepo.find({
      where: { providerId: provider.id, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateAgent(
    userId: string,
    agentId: string,
    dto: Partial<AddAgentDto>,
  ): Promise<LogisticsAgent> {
    const agent = await this.resolveAgentOwnership(userId, agentId);

    const immutable = ['id', 'providerId', 'totalDeliveries'];
    immutable.forEach(k => delete (dto as any)[k]);

    Object.assign(agent, dto);
    return this.agentRepo.save(agent);
  }

  async deactivateAgent(userId: string, agentId: string): Promise<void> {
    const agent = await this.resolveAgentOwnership(userId, agentId);
    agent.isActive = false;
    await this.agentRepo.save(agent);
  }

  // ── Shipment Assignment ───────────────────────────────────────────────────

  async assignShipment(
    sellerId: string,
    dto: AssignShipmentDto,
  ): Promise<ShipmentAssignment> {
    const existing = await this.shipmentRepo.findOne({
      where: { orderId: dto.orderId },
    });
    if (existing) {
      throw new ConflictException(
        `A shipment assignment already exists for order ${dto.orderId}`,
      );
    }

    const provider = await this.providerRepo.findOne({ where: { id: dto.providerId } });
    if (!provider) throw new NotFoundException('Logistics provider not found');
    if (provider.status !== ProviderStatus.ACTIVE) {
      throw new BadRequestException(
        `Provider "${provider.name}" is not currently active`,
      );
    }

    const now        = new Date();
    const initialEntry: StatusHistoryEntry = {
      status:    ShipmentStatus.PENDING,
      timestamp: now.toISOString(),
      note:      'Shipment assignment created, awaiting provider acceptance',
      updatedBy: sellerId,
    };

    const shipment = this.shipmentRepo.create({
      orderId:         dto.orderId,
      sellerId,
      providerId:      dto.providerId,
      pickupAddress:   dto.pickupAddress,
      agreedRate:      dto.agreedRate,
      currency:        dto.currency ?? 'NGN',
      sellerNote:      dto.sellerNote,
      estimatedPickup: dto.estimatedPickup ? new Date(dto.estimatedPickup) : undefined,
      status:          ShipmentStatus.PENDING,
      statusHistory:   [initialEntry],
    });

    const saved = await this.shipmentRepo.save(shipment);
    this.logger.log(`Shipment ${saved.id} assigned to provider ${dto.providerId}`);
    return saved;
  }

  async getMyShipments(
    userId: string,
    status?: ShipmentStatus,
  ): Promise<ShipmentAssignment[]> {
    const provider = await this.getMyProfile(userId);

    const qb = this.shipmentRepo.createQueryBuilder('s')
      .where('s.providerId = :providerId', { providerId: provider.id })
      .orderBy('s.createdAt', 'DESC');

    if (status) {
      qb.andWhere('s.status = :status', { status });
    }

    return qb.getMany();
  }

  async getShipmentByOrder(orderId: string): Promise<ShipmentAssignment & { provider?: LogisticsProvider }> {
    const shipment = await this.shipmentRepo.findOne({ where: { orderId } });
    if (!shipment) throw new NotFoundException(`No shipment assignment found for order ${orderId}`);

    const provider = await this.providerRepo.findOne({
      where: { id: shipment.providerId },
    });

    return { ...shipment, provider: provider ?? undefined };
  }

  // ── Provider Actions on Shipments ─────────────────────────────────────────

  async acceptShipment(
    userId: string,
    shipmentId: string,
  ): Promise<ShipmentAssignment> {
    const { shipment } = await this.resolveShipmentOwnership(userId, shipmentId);

    if (shipment.status !== ShipmentStatus.PENDING) {
      throw new BadRequestException(
        `Shipment cannot be accepted — current status is "${shipment.status}"`,
      );
    }

    shipment.status = ShipmentStatus.ACCEPTED;
    shipment.statusHistory = [
      ...shipment.statusHistory,
      {
        status:    ShipmentStatus.ACCEPTED,
        timestamp: new Date().toISOString(),
        note:      'Shipment accepted by logistics provider',
        updatedBy: userId,
      },
    ];

    return this.shipmentRepo.save(shipment);
  }

  async rejectShipment(
    userId: string,
    shipmentId: string,
    dto: RejectShipmentDto,
  ): Promise<ShipmentAssignment> {
    const { shipment } = await this.resolveShipmentOwnership(userId, shipmentId);

    if (shipment.status !== ShipmentStatus.PENDING) {
      throw new BadRequestException(
        `Shipment cannot be rejected — current status is "${shipment.status}"`,
      );
    }

    shipment.status          = ShipmentStatus.REJECTED;
    shipment.rejectionReason = dto.reason;
    shipment.statusHistory   = [
      ...shipment.statusHistory,
      {
        status:    ShipmentStatus.REJECTED,
        timestamp: new Date().toISOString(),
        note:      dto.reason,
        updatedBy: userId,
      },
    ];

    return this.shipmentRepo.save(shipment);
  }

  async updateShipmentStatus(
    userId: string,
    shipmentId: string,
    dto: UpdateShipmentStatusDto,
  ): Promise<ShipmentAssignment> {
    const { shipment, provider } = await this.resolveShipmentOwnership(userId, shipmentId);

    this.validateStatusTransition(shipment.status, dto.status);

    const now = new Date();
    shipment.status = dto.status;

    if (dto.status === ShipmentStatus.PICKED_UP) {
      shipment.actualPickup = now;
    } else if (dto.status === ShipmentStatus.DELIVERED) {
      shipment.actualDelivery = now;
      await this.providerRepo.increment({ id: provider.id }, 'totalDeliveries', 1);
    }

    if (dto.proofOfDelivery) {
      shipment.proofOfDelivery = dto.proofOfDelivery;
    }

    const entry: StatusHistoryEntry = {
      status:    dto.status,
      timestamp: now.toISOString(),
      updatedBy: userId,
    };
    if (dto.note)     entry.note     = dto.note;
    if (dto.location) entry.location = dto.location;

    shipment.statusHistory = [...shipment.statusHistory, entry];
    const saved = await this.shipmentRepo.save(shipment);

    // Mirror to DeliveryTracking
    const trackingEvent = SHIPMENT_TO_TRACKING[dto.status];
    if (trackingEvent) {
      await this.trackingRepo.save(
        this.trackingRepo.create({
          orderId:     shipment.orderId,
          event:       trackingEvent,
          description: dto.note ?? this.defaultTrackingDescription(dto.status),
          location:    dto.location,
          handlerName: provider.name,
          updatedBy:   userId,
          metadata:    {
            shipmentId: shipment.id,
            providerId: provider.id,
            agentId:    shipment.agentId ?? null,
          },
        }),
      );
    }

    return saved;
  }

  async assignAgent(
    userId: string,
    shipmentId: string,
    dto: AssignAgentDto,
  ): Promise<ShipmentAssignment> {
    const { shipment } = await this.resolveShipmentOwnership(userId, shipmentId);

    const provider = await this.getMyProfile(userId);
    const agent    = await this.agentRepo.findOne({
      where: { id: dto.agentId, providerId: provider.id, isActive: true },
    });
    if (!agent) {
      throw new NotFoundException(
        'Agent not found or does not belong to your provider account',
      );
    }

    shipment.agentId = dto.agentId;
    return this.shipmentRepo.save(shipment);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats(userId: string): Promise<{
    total:     number;
    pending:   number;
    accepted:  number;
    active:    number;
    delivered: number;
    failed:    number;
    rating:    number;
  }> {
    const provider = await this.getMyProfile(userId);

    const qb = this.shipmentRepo.createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('s.providerId = :pid', { pid: provider.id })
      .groupBy('s.status');

    const rows: Array<{ status: string; count: string }> = await qb.getRawMany();

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      counts[row.status] = parseInt(row.count, 10);
      total += counts[row.status];
    }

    return {
      total,
      pending:   counts[ShipmentStatus.PENDING]    ?? 0,
      accepted:  counts[ShipmentStatus.ACCEPTED]   ?? 0,
      active:    (counts[ShipmentStatus.PICKED_UP] ?? 0) + (counts[ShipmentStatus.IN_TRANSIT] ?? 0),
      delivered: counts[ShipmentStatus.DELIVERED]  ?? 0,
      failed:    counts[ShipmentStatus.FAILED]     ?? 0,
      rating:    Number(provider.rating),
    };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async resolveAgentOwnership(
    userId: string,
    agentId: string,
  ): Promise<LogisticsAgent> {
    const provider = await this.getMyProfile(userId);
    const agent    = await this.agentRepo.findOne({
      where: { id: agentId, providerId: provider.id },
    });
    if (!agent) {
      throw new NotFoundException(
        'Agent not found or does not belong to your provider account',
      );
    }
    return agent;
  }

  private async resolveShipmentOwnership(
    userId: string,
    shipmentId: string,
  ): Promise<{ shipment: ShipmentAssignment; provider: LogisticsProvider }> {
    const provider = await this.getMyProfile(userId);
    const shipment = await this.shipmentRepo.findOne({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.providerId !== provider.id) {
      throw new ForbiddenException('You do not have access to this shipment');
    }
    return { shipment, provider };
  }

  private validateStatusTransition(
    current: ShipmentStatus,
    next: ShipmentStatus,
  ): void {
    // REJECTED and FAILED are always terminal — cannot be re-opened
    if (
      current === ShipmentStatus.REJECTED ||
      current === ShipmentStatus.DELIVERED ||
      current === ShipmentStatus.FAILED
    ) {
      throw new BadRequestException(
        `Shipment status "${current}" is terminal and cannot be changed`,
      );
    }

    const currentIdx = STATUS_ORDER.indexOf(current);
    const nextIdx    = STATUS_ORDER.indexOf(next);

    // FAILED is a valid exit from any non-terminal in-progress state
    if (next === ShipmentStatus.FAILED) {
      if (currentIdx < STATUS_ORDER.indexOf(ShipmentStatus.ACCEPTED)) {
        throw new BadRequestException(
          'Cannot mark a shipment as failed before it has been accepted',
        );
      }
      return;
    }

    if (nextIdx === -1) {
      throw new BadRequestException(`Invalid target status: "${next}"`);
    }

    if (nextIdx <= currentIdx) {
      throw new BadRequestException(
        `Cannot transition from "${current}" to "${next}" — status can only move forward`,
      );
    }
  }

  private defaultTrackingDescription(status: ShipmentStatus): string {
    const labels: Partial<Record<ShipmentStatus, string>> = {
      [ShipmentStatus.PICKED_UP]:  'Package picked up by logistics provider',
      [ShipmentStatus.IN_TRANSIT]: 'Package is in transit to destination',
      [ShipmentStatus.DELIVERED]:  'Package delivered successfully',
      [ShipmentStatus.FAILED]:     'Delivery attempt failed',
    };
    return labels[status] ?? status;
  }
}
