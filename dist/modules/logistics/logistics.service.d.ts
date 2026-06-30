import { Repository } from 'typeorm';
import { LogisticsProvider, LogisticsAgent, ShipmentAssignment, ShipmentStatus } from './logistics.entity';
import { RegisterProviderDto, AddAgentDto, AssignShipmentDto, UpdateShipmentStatusDto, RejectShipmentDto, AssignAgentDto, QueryProvidersDto } from './logistics.dto';
import { User } from '../users/user.entity';
import { DeliveryTracking } from '../delivery/delivery.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class LogisticsService {
    private readonly providerRepo;
    private readonly agentRepo;
    private readonly shipmentRepo;
    private readonly trackingRepo;
    private readonly userRepo;
    private readonly notif;
    private readonly logger;
    constructor(providerRepo: Repository<LogisticsProvider>, agentRepo: Repository<LogisticsAgent>, shipmentRepo: Repository<ShipmentAssignment>, trackingRepo: Repository<DeliveryTracking>, userRepo: Repository<User>, notif: NotificationsService);
    register(userId: string, dto: RegisterProviderDto): Promise<LogisticsProvider>;
    getMyProfile(userId: string): Promise<LogisticsProvider>;
    updateProfile(userId: string, dto: Partial<RegisterProviderDto>): Promise<LogisticsProvider>;
    listProviders(query: QueryProvidersDto): Promise<{
        data: LogisticsProvider[];
        total: number;
    }>;
    getProvider(id: string): Promise<LogisticsProvider & {
        agents?: LogisticsAgent[];
    }>;
    addAgent(userId: string, dto: AddAgentDto): Promise<LogisticsAgent>;
    getMyAgents(userId: string): Promise<LogisticsAgent[]>;
    updateAgent(userId: string, agentId: string, dto: Partial<AddAgentDto>): Promise<LogisticsAgent>;
    deactivateAgent(userId: string, agentId: string): Promise<void>;
    assignShipment(sellerId: string, dto: AssignShipmentDto): Promise<ShipmentAssignment>;
    getMyShipments(userId: string, status?: ShipmentStatus): Promise<ShipmentAssignment[]>;
    getShipmentByOrder(orderId: string): Promise<ShipmentAssignment & {
        provider?: LogisticsProvider;
    }>;
    acceptShipment(userId: string, shipmentId: string): Promise<ShipmentAssignment>;
    rejectShipment(userId: string, shipmentId: string, dto: RejectShipmentDto): Promise<ShipmentAssignment>;
    updateShipmentStatus(userId: string, shipmentId: string, dto: UpdateShipmentStatusDto): Promise<ShipmentAssignment>;
    assignAgent(userId: string, shipmentId: string, dto: AssignAgentDto): Promise<ShipmentAssignment>;
    getStats(userId: string): Promise<{
        total: number;
        pending: number;
        accepted: number;
        active: number;
        delivered: number;
        failed: number;
        rating: number;
    }>;
    private resolveAgentOwnership;
    private resolveShipmentOwnership;
    private validateStatusTransition;
    private defaultTrackingDescription;
}
