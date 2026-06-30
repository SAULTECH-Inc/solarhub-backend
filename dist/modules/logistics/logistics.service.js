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
var LogisticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const logistics_entity_1 = require("./logistics.entity");
const user_entity_1 = require("../users/user.entity");
const delivery_entity_1 = require("../delivery/delivery.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const STATUS_ORDER = [
    logistics_entity_1.ShipmentStatus.PENDING,
    logistics_entity_1.ShipmentStatus.ACCEPTED,
    logistics_entity_1.ShipmentStatus.PICKED_UP,
    logistics_entity_1.ShipmentStatus.IN_TRANSIT,
    logistics_entity_1.ShipmentStatus.DELIVERED,
];
const SHIPMENT_TO_TRACKING = {
    [logistics_entity_1.ShipmentStatus.PICKED_UP]: delivery_entity_1.TrackingEventType.DISPATCHED,
    [logistics_entity_1.ShipmentStatus.IN_TRANSIT]: delivery_entity_1.TrackingEventType.IN_TRANSIT,
    [logistics_entity_1.ShipmentStatus.DELIVERED]: delivery_entity_1.TrackingEventType.DELIVERED,
    [logistics_entity_1.ShipmentStatus.FAILED]: delivery_entity_1.TrackingEventType.FAILED_DELIVERY,
};
let LogisticsService = LogisticsService_1 = class LogisticsService {
    constructor(providerRepo, agentRepo, shipmentRepo, trackingRepo, userRepo, notif) {
        this.providerRepo = providerRepo;
        this.agentRepo = agentRepo;
        this.shipmentRepo = shipmentRepo;
        this.trackingRepo = trackingRepo;
        this.userRepo = userRepo;
        this.notif = notif;
        this.logger = new common_1.Logger(LogisticsService_1.name);
    }
    async register(userId, dto) {
        const existing = await this.providerRepo.findOne({ where: { userId } });
        if (existing) {
            throw new common_1.BadRequestException('You already have a logistics provider profile');
        }
        const provider = this.providerRepo.create({
            ...dto,
            userId,
            status: logistics_entity_1.ProviderStatus.PENDING,
        });
        const saved = await this.providerRepo.save(provider);
        await this.userRepo.update(userId, { isLogistics: true });
        this.logger.log(`Logistics provider registered: ${saved.id} by user ${userId}`);
        return saved;
    }
    async getMyProfile(userId) {
        const provider = await this.providerRepo.findOne({ where: { userId } });
        if (!provider)
            throw new common_1.NotFoundException('Logistics provider profile not found');
        return provider;
    }
    async updateProfile(userId, dto) {
        const provider = await this.getMyProfile(userId);
        const immutable = ['id', 'userId', 'status', 'isVerified', 'rating', 'totalDeliveries', 'totalRatings'];
        immutable.forEach(k => delete dto[k]);
        Object.assign(provider, dto);
        return this.providerRepo.save(provider);
    }
    async listProviders(query) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, query.limit ?? 20);
        const skip = (page - 1) * limit;
        const qb = this.providerRepo.createQueryBuilder('p')
            .where('p.status = :status', { status: logistics_entity_1.ProviderStatus.ACTIVE })
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
    async getProvider(id) {
        const provider = await this.providerRepo.findOne({ where: { id } });
        if (!provider)
            throw new common_1.NotFoundException('Logistics provider not found');
        let agents;
        if (provider.type === logistics_entity_1.ProviderType.COMPANY) {
            agents = await this.agentRepo.find({
                where: { providerId: provider.id, isActive: true },
                order: { createdAt: 'DESC' },
            });
        }
        return { ...provider, agents };
    }
    async addAgent(userId, dto) {
        const provider = await this.getMyProfile(userId);
        if (provider.type !== logistics_entity_1.ProviderType.COMPANY) {
            throw new common_1.BadRequestException('Only company providers can manage agents. Individual providers operate themselves.');
        }
        const agent = this.agentRepo.create({ ...dto, providerId: provider.id });
        return this.agentRepo.save(agent);
    }
    async getMyAgents(userId) {
        const provider = await this.getMyProfile(userId);
        return this.agentRepo.find({
            where: { providerId: provider.id, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }
    async updateAgent(userId, agentId, dto) {
        const agent = await this.resolveAgentOwnership(userId, agentId);
        const immutable = ['id', 'providerId', 'totalDeliveries'];
        immutable.forEach(k => delete dto[k]);
        Object.assign(agent, dto);
        return this.agentRepo.save(agent);
    }
    async deactivateAgent(userId, agentId) {
        const agent = await this.resolveAgentOwnership(userId, agentId);
        agent.isActive = false;
        await this.agentRepo.save(agent);
    }
    async assignShipment(sellerId, dto) {
        const existing = await this.shipmentRepo.findOne({
            where: { orderId: dto.orderId },
        });
        if (existing) {
            throw new common_1.ConflictException(`A shipment assignment already exists for order ${dto.orderId}`);
        }
        const provider = await this.providerRepo.findOne({ where: { id: dto.providerId } });
        if (!provider)
            throw new common_1.NotFoundException('Logistics provider not found');
        if (provider.status !== logistics_entity_1.ProviderStatus.ACTIVE) {
            throw new common_1.BadRequestException(`Provider "${provider.name}" is not currently active`);
        }
        const now = new Date();
        const initialEntry = {
            status: logistics_entity_1.ShipmentStatus.PENDING,
            timestamp: now.toISOString(),
            note: 'Shipment assignment created, awaiting provider acceptance',
            updatedBy: sellerId,
        };
        const shipment = this.shipmentRepo.create({
            orderId: dto.orderId,
            sellerId,
            providerId: dto.providerId,
            pickupAddress: dto.pickupAddress,
            agreedRate: dto.agreedRate,
            currency: dto.currency ?? 'NGN',
            sellerNote: dto.sellerNote,
            estimatedPickup: dto.estimatedPickup ? new Date(dto.estimatedPickup) : undefined,
            status: logistics_entity_1.ShipmentStatus.PENDING,
            statusHistory: [initialEntry],
        });
        const saved = await this.shipmentRepo.save(shipment);
        this.logger.log(`Shipment ${saved.id} assigned to provider ${dto.providerId}`);
        return saved;
    }
    async getMyShipments(userId, status) {
        const provider = await this.getMyProfile(userId);
        const qb = this.shipmentRepo.createQueryBuilder('s')
            .where('s.providerId = :providerId', { providerId: provider.id })
            .orderBy('s.createdAt', 'DESC');
        if (status) {
            qb.andWhere('s.status = :status', { status });
        }
        return qb.getMany();
    }
    async getShipmentByOrder(orderId) {
        const shipment = await this.shipmentRepo.findOne({ where: { orderId } });
        if (!shipment)
            throw new common_1.NotFoundException(`No shipment assignment found for order ${orderId}`);
        const provider = await this.providerRepo.findOne({
            where: { id: shipment.providerId },
        });
        return { ...shipment, provider: provider ?? undefined };
    }
    async acceptShipment(userId, shipmentId) {
        const { shipment } = await this.resolveShipmentOwnership(userId, shipmentId);
        if (shipment.status !== logistics_entity_1.ShipmentStatus.PENDING) {
            throw new common_1.BadRequestException(`Shipment cannot be accepted — current status is "${shipment.status}"`);
        }
        shipment.status = logistics_entity_1.ShipmentStatus.ACCEPTED;
        shipment.statusHistory = [
            ...shipment.statusHistory,
            {
                status: logistics_entity_1.ShipmentStatus.ACCEPTED,
                timestamp: new Date().toISOString(),
                note: 'Shipment accepted by logistics provider',
                updatedBy: userId,
            },
        ];
        return this.shipmentRepo.save(shipment);
    }
    async rejectShipment(userId, shipmentId, dto) {
        const { shipment } = await this.resolveShipmentOwnership(userId, shipmentId);
        if (shipment.status !== logistics_entity_1.ShipmentStatus.PENDING) {
            throw new common_1.BadRequestException(`Shipment cannot be rejected — current status is "${shipment.status}"`);
        }
        shipment.status = logistics_entity_1.ShipmentStatus.REJECTED;
        shipment.rejectionReason = dto.reason;
        shipment.statusHistory = [
            ...shipment.statusHistory,
            {
                status: logistics_entity_1.ShipmentStatus.REJECTED,
                timestamp: new Date().toISOString(),
                note: dto.reason,
                updatedBy: userId,
            },
        ];
        return this.shipmentRepo.save(shipment);
    }
    async updateShipmentStatus(userId, shipmentId, dto) {
        const { shipment, provider } = await this.resolveShipmentOwnership(userId, shipmentId);
        this.validateStatusTransition(shipment.status, dto.status);
        const now = new Date();
        shipment.status = dto.status;
        if (dto.status === logistics_entity_1.ShipmentStatus.PICKED_UP) {
            shipment.actualPickup = now;
        }
        else if (dto.status === logistics_entity_1.ShipmentStatus.DELIVERED) {
            shipment.actualDelivery = now;
            await this.providerRepo.increment({ id: provider.id }, 'totalDeliveries', 1);
        }
        if (dto.proofOfDelivery) {
            shipment.proofOfDelivery = dto.proofOfDelivery;
        }
        const entry = {
            status: dto.status,
            timestamp: now.toISOString(),
            updatedBy: userId,
        };
        if (dto.note)
            entry.note = dto.note;
        if (dto.location)
            entry.location = dto.location;
        shipment.statusHistory = [...shipment.statusHistory, entry];
        const saved = await this.shipmentRepo.save(shipment);
        const trackingEvent = SHIPMENT_TO_TRACKING[dto.status];
        if (trackingEvent) {
            await this.trackingRepo.save(this.trackingRepo.create({
                orderId: shipment.orderId,
                event: trackingEvent,
                description: dto.note ?? this.defaultTrackingDescription(dto.status),
                location: dto.location,
                handlerName: provider.name,
                updatedBy: userId,
                metadata: {
                    shipmentId: shipment.id,
                    providerId: provider.id,
                    agentId: shipment.agentId ?? null,
                },
            }));
        }
        return saved;
    }
    async assignAgent(userId, shipmentId, dto) {
        const { shipment } = await this.resolveShipmentOwnership(userId, shipmentId);
        const provider = await this.getMyProfile(userId);
        const agent = await this.agentRepo.findOne({
            where: { id: dto.agentId, providerId: provider.id, isActive: true },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found or does not belong to your provider account');
        }
        shipment.agentId = dto.agentId;
        return this.shipmentRepo.save(shipment);
    }
    async getStats(userId) {
        const provider = await this.getMyProfile(userId);
        const qb = this.shipmentRepo.createQueryBuilder('s')
            .select('s.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('s.providerId = :pid', { pid: provider.id })
            .groupBy('s.status');
        const rows = await qb.getRawMany();
        const counts = {};
        let total = 0;
        for (const row of rows) {
            counts[row.status] = parseInt(row.count, 10);
            total += counts[row.status];
        }
        return {
            total,
            pending: counts[logistics_entity_1.ShipmentStatus.PENDING] ?? 0,
            accepted: counts[logistics_entity_1.ShipmentStatus.ACCEPTED] ?? 0,
            active: (counts[logistics_entity_1.ShipmentStatus.PICKED_UP] ?? 0) + (counts[logistics_entity_1.ShipmentStatus.IN_TRANSIT] ?? 0),
            delivered: counts[logistics_entity_1.ShipmentStatus.DELIVERED] ?? 0,
            failed: counts[logistics_entity_1.ShipmentStatus.FAILED] ?? 0,
            rating: Number(provider.rating),
        };
    }
    async resolveAgentOwnership(userId, agentId) {
        const provider = await this.getMyProfile(userId);
        const agent = await this.agentRepo.findOne({
            where: { id: agentId, providerId: provider.id },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found or does not belong to your provider account');
        }
        return agent;
    }
    async resolveShipmentOwnership(userId, shipmentId) {
        const provider = await this.getMyProfile(userId);
        const shipment = await this.shipmentRepo.findOne({ where: { id: shipmentId } });
        if (!shipment)
            throw new common_1.NotFoundException('Shipment not found');
        if (shipment.providerId !== provider.id) {
            throw new common_1.ForbiddenException('You do not have access to this shipment');
        }
        return { shipment, provider };
    }
    validateStatusTransition(current, next) {
        if (current === logistics_entity_1.ShipmentStatus.REJECTED ||
            current === logistics_entity_1.ShipmentStatus.DELIVERED ||
            current === logistics_entity_1.ShipmentStatus.FAILED) {
            throw new common_1.BadRequestException(`Shipment status "${current}" is terminal and cannot be changed`);
        }
        const currentIdx = STATUS_ORDER.indexOf(current);
        const nextIdx = STATUS_ORDER.indexOf(next);
        if (next === logistics_entity_1.ShipmentStatus.FAILED) {
            if (currentIdx < STATUS_ORDER.indexOf(logistics_entity_1.ShipmentStatus.ACCEPTED)) {
                throw new common_1.BadRequestException('Cannot mark a shipment as failed before it has been accepted');
            }
            return;
        }
        if (nextIdx === -1) {
            throw new common_1.BadRequestException(`Invalid target status: "${next}"`);
        }
        if (nextIdx <= currentIdx) {
            throw new common_1.BadRequestException(`Cannot transition from "${current}" to "${next}" — status can only move forward`);
        }
    }
    defaultTrackingDescription(status) {
        const labels = {
            [logistics_entity_1.ShipmentStatus.PICKED_UP]: 'Package picked up by logistics provider',
            [logistics_entity_1.ShipmentStatus.IN_TRANSIT]: 'Package is in transit to destination',
            [logistics_entity_1.ShipmentStatus.DELIVERED]: 'Package delivered successfully',
            [logistics_entity_1.ShipmentStatus.FAILED]: 'Delivery attempt failed',
        };
        return labels[status] ?? status;
    }
};
exports.LogisticsService = LogisticsService;
exports.LogisticsService = LogisticsService = LogisticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(logistics_entity_1.LogisticsProvider)),
    __param(1, (0, typeorm_1.InjectRepository)(logistics_entity_1.LogisticsAgent)),
    __param(2, (0, typeorm_1.InjectRepository)(logistics_entity_1.ShipmentAssignment)),
    __param(3, (0, typeorm_1.InjectRepository)(delivery_entity_1.DeliveryTracking)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], LogisticsService);
//# sourceMappingURL=logistics.service.js.map