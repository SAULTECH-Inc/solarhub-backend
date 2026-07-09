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
exports.Engineer = exports.EngineerStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
var EngineerStatus;
(function (EngineerStatus) {
    EngineerStatus["ACTIVE"] = "active";
    EngineerStatus["SUSPENDED"] = "suspended";
    EngineerStatus["FLAGGED"] = "flagged";
})(EngineerStatus || (exports.EngineerStatus = EngineerStatus = {}));
let Engineer = class Engineer {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, userId: { required: true, type: () => String }, user: { required: true, type: () => require("../users/user.entity").User }, fullName: { required: true, type: () => String }, phone: { required: true, type: () => String }, nin: { required: true, type: () => String }, ninData: { required: true, type: () => Object }, govtIdType: { required: true, type: () => String }, govtIdUrl: { required: true, type: () => String }, address: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, country: { required: true, type: () => String }, latitude: { required: true, type: () => Number }, longitude: { required: true, type: () => Number }, serviceRadiusKm: { required: true, type: () => Number }, bio: { required: true, type: () => String }, profilePhoto: { required: true, type: () => String }, yearsOfExperience: { required: true, type: () => Number }, specializations: { required: true, type: () => [String] }, certifications: { required: true }, availableForHire: { required: true, type: () => Boolean }, socialLinks: { required: true, type: () => ({ whatsapp: { required: false, type: () => String }, instagram: { required: false, type: () => String }, facebook: { required: false, type: () => String }, twitter: { required: false, type: () => String } }) }, status: { required: true, enum: require("./engineer.entity").EngineerStatus }, adminNote: { required: true, type: () => String }, averageRating: { required: true, type: () => Number }, reviewCount: { required: true, type: () => Number }, completedJobs: { required: true, type: () => Number }, isVerified: { required: true, type: () => Boolean }, verifiedAt: { required: true, type: () => Date }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.Engineer = Engineer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Engineer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Engineer.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Engineer.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Engineer.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Engineer.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Engineer.prototype, "nin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Engineer.prototype, "ninData", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Engineer.prototype, "govtIdType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], Engineer.prototype, "govtIdUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Engineer.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Engineer.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Engineer.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: 'Nigeria' }),
    __metadata("design:type", String)
], Engineer.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Engineer.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Engineer.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 50 }),
    __metadata("design:type", Number)
], Engineer.prototype, "serviceRadiusKm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Engineer.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], Engineer.prototype, "profilePhoto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Engineer.prototype, "yearsOfExperience", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], Engineer.prototype, "specializations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], Engineer.prototype, "certifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Engineer.prototype, "availableForHire", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Engineer.prototype, "socialLinks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EngineerStatus, default: EngineerStatus.ACTIVE }),
    __metadata("design:type", String)
], Engineer.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Engineer.prototype, "adminNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Engineer.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Engineer.prototype, "reviewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Engineer.prototype, "completedJobs", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Engineer.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Engineer.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Engineer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Engineer.prototype, "updatedAt", void 0);
exports.Engineer = Engineer = __decorate([
    (0, typeorm_1.Entity)('engineers'),
    (0, typeorm_1.Index)(['userId'], { unique: true })
], Engineer);
//# sourceMappingURL=engineer.entity.js.map