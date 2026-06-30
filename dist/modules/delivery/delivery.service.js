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
var DeliveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const delivery_entity_1 = require("./delivery.entity");
const orders_service_1 = require("../orders/orders.service");
const notifications_service_1 = require("../notifications/notifications.service");
const order_entity_1 = require("../orders/order.entity");
const EVENT_LABELS = {
    [delivery_entity_1.TrackingEventType.ORDER_PLACED]: 'Order Placed',
    [delivery_entity_1.TrackingEventType.PAYMENT_CONFIRMED]: 'Payment Confirmed',
    [delivery_entity_1.TrackingEventType.PROCESSING]: 'Order Being Processed',
    [delivery_entity_1.TrackingEventType.DISPATCHED]: 'Dispatched from Seller',
    [delivery_entity_1.TrackingEventType.IN_TRANSIT]: 'In Transit',
    [delivery_entity_1.TrackingEventType.ARRIVED_HUB]: 'Arrived at Local Hub',
    [delivery_entity_1.TrackingEventType.OUT_FOR_DELIVERY]: 'Out for Delivery',
    [delivery_entity_1.TrackingEventType.DELIVERED]: 'Delivered',
    [delivery_entity_1.TrackingEventType.FAILED_DELIVERY]: 'Delivery Attempt Failed',
    [delivery_entity_1.TrackingEventType.RETURNED]: 'Returned to Sender',
};
const STATUS_TO_EVENT = {
    [order_entity_1.OrderStatus.CONFIRMED]: delivery_entity_1.TrackingEventType.PAYMENT_CONFIRMED,
    [order_entity_1.OrderStatus.PROCESSING]: delivery_entity_1.TrackingEventType.PROCESSING,
    [order_entity_1.OrderStatus.DISPATCHED]: delivery_entity_1.TrackingEventType.DISPATCHED,
    [order_entity_1.OrderStatus.IN_TRANSIT]: delivery_entity_1.TrackingEventType.IN_TRANSIT,
    [order_entity_1.OrderStatus.OUT_DELIVERY]: delivery_entity_1.TrackingEventType.OUT_FOR_DELIVERY,
    [order_entity_1.OrderStatus.DELIVERED]: delivery_entity_1.TrackingEventType.DELIVERED,
};
let DeliveryService = DeliveryService_1 = class DeliveryService {
    constructor(repo, orders, notif) {
        this.repo = repo;
        this.orders = orders;
        this.notif = notif;
        this.logger = new common_1.Logger(DeliveryService_1.name);
    }
    async addEvent(orderId, event, options) {
        const tracking = this.repo.create({
            orderId,
            event,
            description: options?.description || EVENT_LABELS[event],
            location: options?.location,
            handlerName: options?.handlerName,
            updatedBy: options?.updatedBy,
            metadata: options?.metadata,
        });
        const saved = await this.repo.save(tracking);
        this.logger.log(`Tracking event [${event}] added for order ${orderId}`);
        return saved;
    }
    async syncFromOrderStatus(order, newStatus, updatedBy, note) {
        const event = STATUS_TO_EVENT[newStatus];
        if (!event)
            return;
        const exists = await this.repo.findOne({
            where: { orderId: order.id, event },
        });
        if (exists)
            return;
        await this.addEvent(order.id, event, {
            description: note || EVENT_LABELS[event],
            updatedBy,
        });
    }
    async getTrackingHistory(orderId) {
        const order = await this.orders.findById(orderId);
        const tracking = await this.repo.find({
            where: { orderId },
            order: { timestamp: 'ASC' },
        });
        const allEvents = Object.values(delivery_entity_1.TrackingEventType).filter(e => ![delivery_entity_1.TrackingEventType.FAILED_DELIVERY, delivery_entity_1.TrackingEventType.RETURNED].includes(e));
        const doneEvents = tracking.map(t => t.event);
        const current = doneEvents[doneEvents.length - 1] || delivery_entity_1.TrackingEventType.ORDER_PLACED;
        const progress = Math.round((doneEvents.length / allEvents.length) * 100);
        return {
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                trackingCode: order.trackingCode,
                estimatedDelivery: order.estimatedDelivery,
                deliveryAddress: order.deliveryAddress,
            },
            tracking,
            currentStatus: current,
            progress,
        };
    }
    async getByTrackingCode(trackingCode) {
        const qb = this.repo.manager
            .getRepository(order_entity_1.Order)
            .createQueryBuilder('o')
            .where('o.trackingCode = :code', { code: trackingCode.toUpperCase() });
        const order = await qb.getOne();
        if (!order)
            throw new common_1.NotFoundException('Tracking code not found');
        return this.getTrackingHistory(order.id);
    }
    async autoProgressOrders() {
        this.logger.log('Auto-progressing pending orders...');
    }
    async getDeliveryStats() {
        const delivered = await this.repo.count({
            where: { event: delivery_entity_1.TrackingEventType.DELIVERED },
        });
        const inTransit = await this.repo.count({
            where: { event: delivery_entity_1.TrackingEventType.IN_TRANSIT },
        });
        const failed = await this.repo.count({
            where: { event: delivery_entity_1.TrackingEventType.FAILED_DELIVERY },
        });
        return { delivered, inTransit, failed };
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = DeliveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(delivery_entity_1.DeliveryTracking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        orders_service_1.OrdersService,
        notifications_service_1.NotificationsService])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map