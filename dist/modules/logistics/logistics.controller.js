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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logistics_service_1 = require("./logistics.service");
const logistics_dto_1 = require("./logistics.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const decorators_1 = require("../../common/decorators");
const logistics_entity_1 = require("./logistics.entity");
let LogisticsController = class LogisticsController {
    constructor(svc) {
        this.svc = svc;
    }
    register(uid, dto) {
        return this.svc.register(uid, dto);
    }
    getMyProfile(uid) {
        return this.svc.getMyProfile(uid);
    }
    updateProfile(uid, dto) {
        return this.svc.updateProfile(uid, dto);
    }
    getStats(uid) {
        return this.svc.getStats(uid);
    }
    listProviders(query) {
        return this.svc.listProviders(query);
    }
    getProvider(id) {
        return this.svc.getProvider(id);
    }
    addAgent(uid, dto) {
        return this.svc.addAgent(uid, dto);
    }
    getMyAgents(uid) {
        return this.svc.getMyAgents(uid);
    }
    updateAgent(uid, agentId, dto) {
        return this.svc.updateAgent(uid, agentId, dto);
    }
    deactivateAgent(uid, agentId) {
        return this.svc.deactivateAgent(uid, agentId);
    }
    assignShipment(uid, dto) {
        return this.svc.assignShipment(uid, dto);
    }
    getMyShipments(uid, query) {
        return this.svc.getMyShipments(uid, query.status);
    }
    getShipmentByOrder(orderId) {
        return this.svc.getShipmentByOrder(orderId);
    }
    acceptShipment(uid, shipmentId) {
        return this.svc.acceptShipment(uid, shipmentId);
    }
    rejectShipment(uid, shipmentId, dto) {
        return this.svc.rejectShipment(uid, shipmentId, dto);
    }
    updateShipmentStatus(uid, shipmentId, dto) {
        return this.svc.updateShipmentStatus(uid, shipmentId, dto);
    }
    assignAgent(uid, shipmentId, dto) {
        return this.svc.assignAgent(uid, shipmentId, dto);
    }
};
exports.LogisticsController = LogisticsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register as a logistics provider' }),
    openapi.ApiResponse({ status: 201, type: require("./logistics.entity").LogisticsProvider }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, logistics_dto_1.RegisterProviderDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own logistics provider profile' }),
    openapi.ApiResponse({ status: 200, type: require("./logistics.entity").LogisticsProvider }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update own logistics provider profile' }),
    openapi.ApiResponse({ status: 200, type: require("./logistics.entity").LogisticsProvider }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('me/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shipment statistics for own provider account' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "getStats", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({ summary: 'List / search active logistics providers (public)' }),
    (0, swagger_1.ApiQuery)({ name: 'state', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'vehicleType', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [logistics_dto_1.QueryProvidersDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "listProviders", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('providers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a logistics provider profile (public)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Provider UUID' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "getProvider", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('me/agents'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a delivery agent to your company provider' }),
    openapi.ApiResponse({ status: 201, type: require("./logistics.entity").LogisticsAgent }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, logistics_dto_1.AddAgentDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "addAgent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('me/agents'),
    (0, swagger_1.ApiOperation)({ summary: 'List active agents for own provider' }),
    openapi.ApiResponse({ status: 200, type: [require("./logistics.entity").LogisticsAgent] }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "getMyAgents", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('me/agents/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a delivery agent' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Agent UUID' }),
    openapi.ApiResponse({ status: 200, type: require("./logistics.entity").LogisticsAgent }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Delete)('me/agents/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a delivery agent' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Agent UUID' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "deactivateAgent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('shipments'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a shipment to a logistics provider (seller action)' }),
    openapi.ApiResponse({ status: 201, type: require("./logistics.entity").ShipmentAssignment }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, logistics_dto_1.AssignShipmentDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "assignShipment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('shipments'),
    (0, swagger_1.ApiOperation)({ summary: 'List shipments for own provider account' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: logistics_entity_1.ShipmentStatus }),
    openapi.ApiResponse({ status: 200, type: [require("./logistics.entity").ShipmentAssignment] }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, logistics_dto_1.QueryShipmentsDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "getMyShipments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('shipments/order/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shipment assignment by order ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Order UUID' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "getShipmentByOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('shipments/:id/accept'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a pending shipment (provider action)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shipment UUID' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("./logistics.entity").ShipmentAssignment }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "acceptShipment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('shipments/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a pending shipment (provider action)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shipment UUID' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("./logistics.entity").ShipmentAssignment }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, logistics_dto_1.RejectShipmentDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "rejectShipment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('shipments/:id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update shipment status (provider action)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shipment UUID' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("./logistics.entity").ShipmentAssignment }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, logistics_dto_1.UpdateShipmentStatusDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "updateShipmentStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Patch)('shipments/:id/agent'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a specific agent to a shipment (provider action)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shipment UUID' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: require("./logistics.entity").ShipmentAssignment }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, logistics_dto_1.AssignAgentDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "assignAgent", null);
exports.LogisticsController = LogisticsController = __decorate([
    (0, swagger_1.ApiTags)('Logistics'),
    (0, common_1.Controller)('logistics'),
    __metadata("design:paramtypes", [logistics_service_1.LogisticsService])
], LogisticsController);
//# sourceMappingURL=logistics.controller.js.map