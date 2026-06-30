import { LogisticsService } from './logistics.service';
import { RegisterProviderDto, AddAgentDto, AssignShipmentDto, UpdateShipmentStatusDto, RejectShipmentDto, AssignAgentDto, QueryProvidersDto, QueryShipmentsDto } from './logistics.dto';
export declare class LogisticsController {
    private readonly svc;
    constructor(svc: LogisticsService);
    register(uid: string, dto: RegisterProviderDto): Promise<import("./logistics.entity").LogisticsProvider>;
    getMyProfile(uid: string): Promise<import("./logistics.entity").LogisticsProvider>;
    updateProfile(uid: string, dto: Partial<RegisterProviderDto>): Promise<import("./logistics.entity").LogisticsProvider>;
    getStats(uid: string): Promise<{
        total: number;
        pending: number;
        accepted: number;
        active: number;
        delivered: number;
        failed: number;
        rating: number;
    }>;
    listProviders(query: QueryProvidersDto): Promise<{
        data: import("./logistics.entity").LogisticsProvider[];
        total: number;
    }>;
    getProvider(id: string): Promise<import("./logistics.entity").LogisticsProvider & {
        agents?: import("./logistics.entity").LogisticsAgent[];
    }>;
    addAgent(uid: string, dto: AddAgentDto): Promise<import("./logistics.entity").LogisticsAgent>;
    getMyAgents(uid: string): Promise<import("./logistics.entity").LogisticsAgent[]>;
    updateAgent(uid: string, agentId: string, dto: Partial<AddAgentDto>): Promise<import("./logistics.entity").LogisticsAgent>;
    deactivateAgent(uid: string, agentId: string): Promise<void>;
    assignShipment(uid: string, dto: AssignShipmentDto): Promise<import("./logistics.entity").ShipmentAssignment>;
    getMyShipments(uid: string, query: QueryShipmentsDto): Promise<import("./logistics.entity").ShipmentAssignment[]>;
    getShipmentByOrder(orderId: string): Promise<import("./logistics.entity").ShipmentAssignment & {
        provider?: import("./logistics.entity").LogisticsProvider;
    }>;
    acceptShipment(uid: string, shipmentId: string): Promise<import("./logistics.entity").ShipmentAssignment>;
    rejectShipment(uid: string, shipmentId: string, dto: RejectShipmentDto): Promise<import("./logistics.entity").ShipmentAssignment>;
    updateShipmentStatus(uid: string, shipmentId: string, dto: UpdateShipmentStatusDto): Promise<import("./logistics.entity").ShipmentAssignment>;
    assignAgent(uid: string, shipmentId: string, dto: AssignAgentDto): Promise<import("./logistics.entity").ShipmentAssignment>;
}
