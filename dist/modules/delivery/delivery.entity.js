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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryTracking = exports.TrackingEventType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
var TrackingEventType;
(function (TrackingEventType) {
    TrackingEventType["ORDER_PLACED"] = "order_placed";
    TrackingEventType["PAYMENT_CONFIRMED"] = "payment_confirmed";
    TrackingEventType["PROCESSING"] = "processing";
    TrackingEventType["DISPATCHED"] = "dispatched";
    TrackingEventType["IN_TRANSIT"] = "in_transit";
    TrackingEventType["ARRIVED_HUB"] = "arrived_hub";
    TrackingEventType["OUT_FOR_DELIVERY"] = "out_for_delivery";
    TrackingEventType["DELIVERED"] = "delivered";
    TrackingEventType["FAILED_DELIVERY"] = "failed_delivery";
    TrackingEventType["RETURNED"] = "returned";
})(TrackingEventType || (exports.TrackingEventType = TrackingEventType = {}));
let DeliveryTracking = class DeliveryTracking {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, orderId: { required: true, type: () => String }, event: { required: true, enum: require("./delivery.entity").TrackingEventType }, description: { required: true, type: () => String }, location: { required: true, type: () => String }, handlerName: { required: true, type: () => String }, updatedBy: { required: true, type: () => String }, metadata: { required: true, type: () => Object }, timestamp: { required: true, type: () => Date } };
    }
};
exports.DeliveryTracking = DeliveryTracking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeliveryTracking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], DeliveryTracking.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TrackingEventType }),
    __metadata("design:type", String)
], DeliveryTracking.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], DeliveryTracking.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 200 }),
    __metadata("design:type", String)
], DeliveryTracking.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 200 }),
    __metadata("design:type", String)
], DeliveryTracking.prototype, "handlerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryTracking.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DeliveryTracking.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DeliveryTracking.prototype, "timestamp", void 0);
exports.DeliveryTracking = DeliveryTracking = __decorate([
    (0, typeorm_1.Entity)('delivery_tracking')
], DeliveryTracking);
//# sourceMappingURL=delivery.entity.js.map