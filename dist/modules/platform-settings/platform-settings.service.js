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
var PlatformSettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const platform_setting_entity_1 = require("./platform-setting.entity");
const DEFAULTS = {
    escrow_enabled: { value: 'false', description: 'Enable/disable the escrow payment feature' },
    escrow_fee_percent: { value: '1.5', description: 'Platform fee percentage deducted from escrow on release' },
    escrow_auto_release_days: { value: '7', description: 'Days after seller ships before funds auto-release to seller' },
    escrow_dispute_window_days: { value: '3', description: 'Days buyer has after delivery confirmation to raise a dispute' },
};
let PlatformSettingsService = PlatformSettingsService_1 = class PlatformSettingsService {
    constructor(repo) {
        this.repo = repo;
        this.logger = new common_1.Logger(PlatformSettingsService_1.name);
    }
    async onModuleInit() {
        for (const [key, { value, description }] of Object.entries(DEFAULTS)) {
            const exists = await this.repo.findOne({ where: { key } });
            if (!exists) {
                await this.repo.save(this.repo.create({ key, value, description }));
                this.logger.log(`Platform setting seeded: ${key}=${value}`);
            }
        }
    }
    async get(key) {
        const row = await this.repo.findOne({ where: { key } });
        return row?.value ?? DEFAULTS[key]?.value ?? null;
    }
    async getBoolean(key) {
        const val = await this.get(key);
        return val === 'true';
    }
    async getNumber(key) {
        const val = await this.get(key);
        return parseFloat(val ?? '0');
    }
    async set(key, value) {
        let row = await this.repo.findOne({ where: { key } });
        if (!row) {
            row = this.repo.create({ key, value, description: DEFAULTS[key]?.description ?? null });
        }
        else {
            row.value = value;
        }
        return this.repo.save(row);
    }
    async getAll() {
        return this.repo.find({ order: { key: 'ASC' } });
    }
};
exports.PlatformSettingsService = PlatformSettingsService;
exports.PlatformSettingsService = PlatformSettingsService = PlatformSettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(platform_setting_entity_1.PlatformSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlatformSettingsService);
//# sourceMappingURL=platform-settings.service.js.map