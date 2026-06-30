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
exports.AdvisorSession = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let AdvisorSession = class AdvisorSession {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, userId: { required: true, type: () => String }, appliances: { required: true }, preferences: { required: true, type: () => ({ location: { required: true, type: () => String }, sunHours: { required: true, type: () => Number }, backupFactor: { required: true, type: () => Number }, gridSituation: { required: true, type: () => String }, priority: { required: true, type: () => String } }) }, results: { required: true, type: () => ({ adjustedDailyLoad: { required: true, type: () => Number }, peakLoad: { required: true, type: () => Number }, recommendations: { required: true, type: () => [Object] } }) }, totalWh: { required: true, type: () => Number }, peakWatts: { required: true, type: () => Number }, selectedRecommendation: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.AdvisorSession = AdvisorSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdvisorSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AdvisorSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Array)
], AdvisorSession.prototype, "appliances", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], AdvisorSession.prototype, "preferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], AdvisorSession.prototype, "results", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AdvisorSession.prototype, "totalWh", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AdvisorSession.prototype, "peakWatts", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AdvisorSession.prototype, "selectedRecommendation", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AdvisorSession.prototype, "createdAt", void 0);
exports.AdvisorSession = AdvisorSession = __decorate([
    (0, typeorm_1.Entity)('advisor_sessions')
], AdvisorSession);
//# sourceMappingURL=advisor.entity.js.map