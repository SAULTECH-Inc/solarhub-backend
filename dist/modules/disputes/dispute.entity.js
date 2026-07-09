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
exports.Dispute = exports.DisputePriority = exports.DisputeResolution = exports.DisputeStatus = exports.DisputeCategory = exports.DisputeType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
var DisputeType;
(function (DisputeType) {
    DisputeType["ORDER"] = "order";
    DisputeType["PAYMENT"] = "payment";
    DisputeType["PRODUCT"] = "product";
    DisputeType["SERVICE"] = "service";
    DisputeType["FRAUD"] = "fraud";
    DisputeType["INQUIRY"] = "inquiry";
})(DisputeType || (exports.DisputeType = DisputeType = {}));
var DisputeCategory;
(function (DisputeCategory) {
    DisputeCategory["ITEM_NOT_RECEIVED"] = "item_not_received";
    DisputeCategory["ITEM_NOT_AS_DESCRIBED"] = "item_not_as_described";
    DisputeCategory["DAMAGED_ITEM"] = "damaged_item";
    DisputeCategory["UNAUTHORIZED_CHARGE"] = "unauthorized_charge";
    DisputeCategory["REFUND_NOT_ISSUED"] = "refund_not_issued";
    DisputeCategory["DOUBLE_CHARGE"] = "double_charge";
    DisputeCategory["SELLER_MISCONDUCT"] = "seller_misconduct";
    DisputeCategory["ENGINEER_MISCONDUCT"] = "engineer_misconduct";
    DisputeCategory["LOGISTICS_ISSUE"] = "logistics_issue";
    DisputeCategory["FAKE_PRODUCT"] = "fake_product";
    DisputeCategory["SCAM_ATTEMPT"] = "scam_attempt";
    DisputeCategory["OFF_PLATFORM_PAYMENT"] = "off_platform_payment";
    DisputeCategory["ACCOUNT_COMPROMISED"] = "account_compromised";
    DisputeCategory["FAKE_REVIEW"] = "fake_review";
    DisputeCategory["OTHER"] = "other";
})(DisputeCategory || (exports.DisputeCategory = DisputeCategory = {}));
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["OPEN"] = "open";
    DisputeStatus["UNDER_REVIEW"] = "under_review";
    DisputeStatus["AWAITING_RESPONSE"] = "awaiting_response";
    DisputeStatus["RESOLVED"] = "resolved";
    DisputeStatus["CLOSED"] = "closed";
    DisputeStatus["ESCALATED"] = "escalated";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
var DisputeResolution;
(function (DisputeResolution) {
    DisputeResolution["FULL_REFUND"] = "full_refund";
    DisputeResolution["PARTIAL_REFUND"] = "partial_refund";
    DisputeResolution["SELLER_FAVOR"] = "seller_favor";
    DisputeResolution["DISMISSED"] = "dismissed";
    DisputeResolution["WARNING_ISSUED"] = "warning_issued";
    DisputeResolution["ACCOUNT_SUSPENDED"] = "account_suspended";
    DisputeResolution["LAW_ENFORCEMENT_REFERRED"] = "law_enforcement_referred";
})(DisputeResolution || (exports.DisputeResolution = DisputeResolution = {}));
var DisputePriority;
(function (DisputePriority) {
    DisputePriority["LOW"] = "low";
    DisputePriority["NORMAL"] = "normal";
    DisputePriority["HIGH"] = "high";
    DisputePriority["URGENT"] = "urgent";
})(DisputePriority || (exports.DisputePriority = DisputePriority = {}));
let Dispute = class Dispute {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, type: { required: true, enum: require("./dispute.entity").DisputeType }, category: { required: true, enum: require("./dispute.entity").DisputeCategory }, status: { required: true, enum: require("./dispute.entity").DisputeStatus }, priority: { required: true, enum: require("./dispute.entity").DisputePriority }, resolution: { required: true, enum: require("./dispute.entity").DisputeResolution }, subject: { required: true, type: () => String }, description: { required: true, type: () => String }, respondentResponse: { required: true, type: () => String }, adminNote: { required: true, type: () => String }, resolutionNote: { required: true, type: () => String }, evidence: { required: true, type: () => [String] }, amountDisputed: { required: true, type: () => Number }, claimantId: { required: true, type: () => String }, claimant: { required: true, type: () => require("../users/user.entity").User }, respondentId: { required: true, type: () => String }, respondent: { required: true, type: () => require("../users/user.entity").User }, orderId: { required: true, type: () => String }, paymentId: { required: true, type: () => String }, productId: { required: true, type: () => String }, assignedToId: { required: true, type: () => String }, assignedTo: { required: true, type: () => require("../users/user.entity").User }, resolvedAt: { required: true, type: () => Date }, respondentDeadline: { required: true, type: () => Date }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.Dispute = Dispute;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Dispute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DisputeType }),
    __metadata("design:type", String)
], Dispute.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DisputeCategory }),
    __metadata("design:type", String)
], Dispute.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN }),
    __metadata("design:type", String)
], Dispute.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DisputePriority, default: DisputePriority.NORMAL }),
    __metadata("design:type", String)
], Dispute.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DisputeResolution, nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "resolution", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Dispute.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Dispute.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "respondentResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "adminNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "resolutionNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Dispute.prototype, "evidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Dispute.prototype, "amountDisputed", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Dispute.prototype, "claimantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'claimantId' }),
    __metadata("design:type", user_entity_1.User)
], Dispute.prototype, "claimant", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "respondentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'respondentId' }),
    __metadata("design:type", user_entity_1.User)
], Dispute.prototype, "respondent", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assignedToId' }),
    __metadata("design:type", user_entity_1.User)
], Dispute.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Dispute.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Dispute.prototype, "respondentDeadline", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Dispute.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Dispute.prototype, "updatedAt", void 0);
exports.Dispute = Dispute = __decorate([
    (0, typeorm_1.Entity)('disputes'),
    (0, typeorm_1.Index)(['claimantId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['type'])
], Dispute);
//# sourceMappingURL=dispute.entity.js.map