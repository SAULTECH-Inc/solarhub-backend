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
exports.RfqBid = exports.Rfq = exports.BidStatus = exports.RfqStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
var RfqStatus;
(function (RfqStatus) {
    RfqStatus["OPEN"] = "open";
    RfqStatus["REVIEWING"] = "reviewing";
    RfqStatus["AWARDED"] = "awarded";
    RfqStatus["CANCELED"] = "canceled";
})(RfqStatus || (exports.RfqStatus = RfqStatus = {}));
var BidStatus;
(function (BidStatus) {
    BidStatus["PENDING"] = "pending";
    BidStatus["ACCEPTED"] = "accepted";
    BidStatus["REJECTED"] = "rejected";
})(BidStatus || (exports.BidStatus = BidStatus = {}));
let Rfq = class Rfq {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, userId: { required: true, type: () => String }, user: { required: true, type: () => require("../users/user.entity").User }, advisorSessionId: { required: true, type: () => String }, systemSpecs: { required: true, type: () => Object }, address: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, timeline: { required: true, type: () => String }, description: { required: true, type: () => String }, status: { required: true, enum: require("./rfq.entity").RfqStatus }, bids: { required: true, type: () => [require("./rfq.entity").RfqBid] }, bidCount: { required: true, type: () => Number }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.Rfq = Rfq;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Rfq.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Rfq.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], Rfq.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Rfq.prototype, "advisorSessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Rfq.prototype, "systemSpecs", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Rfq.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Rfq.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Rfq.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Rfq.prototype, "timeline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Rfq.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RfqStatus, default: RfqStatus.OPEN }),
    __metadata("design:type", String)
], Rfq.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RfqBid, bid => bid.rfq),
    __metadata("design:type", Array)
], Rfq.prototype, "bids", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Rfq.prototype, "bidCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Rfq.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Rfq.prototype, "updatedAt", void 0);
exports.Rfq = Rfq = __decorate([
    (0, typeorm_1.Entity)('rfqs')
], Rfq);
let RfqBid = class RfqBid {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, rfqId: { required: true, type: () => String }, rfq: { required: true, type: () => require("./rfq.entity").Rfq }, contractorId: { required: true, type: () => String }, contractor: { required: true, type: () => require("../users/user.entity").User }, hardwareCost: { required: true, type: () => Number }, laborCost: { required: true, type: () => Number }, totalAmount: { required: true, type: () => Number }, proposalText: { required: true, type: () => String }, status: { required: true, enum: require("./rfq.entity").BidStatus }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.RfqBid = RfqBid;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RfqBid.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RfqBid.prototype, "rfqId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Rfq, rfq => rfq.bids, { onDelete: 'CASCADE' }),
    __metadata("design:type", Rfq)
], RfqBid.prototype, "rfq", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RfqBid.prototype, "contractorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], RfqBid.prototype, "contractor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], RfqBid.prototype, "hardwareCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], RfqBid.prototype, "laborCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], RfqBid.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], RfqBid.prototype, "proposalText", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: BidStatus, default: BidStatus.PENDING }),
    __metadata("design:type", String)
], RfqBid.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RfqBid.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RfqBid.prototype, "updatedAt", void 0);
exports.RfqBid = RfqBid = __decorate([
    (0, typeorm_1.Entity)('rfq_bids')
], RfqBid);
//# sourceMappingURL=rfq.entity.js.map