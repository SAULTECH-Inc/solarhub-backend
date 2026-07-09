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
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const sdk_1 = require("@anthropic-ai/sdk");
const sharp = require("sharp");
const SPEC_PROMPTS = {
    'solar-panels': 'Extract solar panel specs from this product label/datasheet. Return ONLY valid JSON with these keys if visible: brand, model, pmaxWp, vocV, vmpV, iscA, impA, efficiencyPct, tempCoeff, dimensionsMm, weightKg, cellCount, maxSysVoltage, certifications',
    batteries: 'Extract battery specs. Return ONLY valid JSON: brand, model, chemistry, capacityAh, voltageV, dodPct, cycleLife, chargeRate, dischargeRate, hasBms, weightKg, certifications',
    inverters: 'Extract inverter specs. Return ONLY valid JSON: brand, model, inverterType, continuousW, surgeW, efficiencyPct, dcInputV, acOutputV, noLoadW, transferMs, hasBuiltInMppt, hasGridFailover, communication, weightKg, certifications',
    'charge-controllers': 'Extract charge controller specs. Return ONLY valid JSON: brand, model, ctrlType, maxPvVocV, chargeCurrentA, maxEffPct, systemVoltage, communication, certifications',
    'solar-lights': 'Extract solar light specs. Return ONLY valid JSON: lumens, ledPowerW, colorTempK, panelW, batteryAh, lightingHrs, ipRating',
    accessories: 'Extract product specs from this label. Return ONLY valid JSON with any visible fields.',
};
let UploadsService = UploadsService_1 = class UploadsService {
    constructor(cfg) {
        this.cfg = cfg;
        this.logger = new common_1.Logger(UploadsService_1.name);
        cloudinary_1.v2.config({
            cloud_name: cfg.get('cloudinary.cloudName'),
            api_key: cfg.get('cloudinary.apiKey'),
            api_secret: cfg.get('cloudinary.apiSecret'),
        });
        this.anthropic = new sdk_1.default({ apiKey: cfg.get('anthropic.apiKey') });
    }
    async uploadImage(file, folder = 'general') {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const maxMb = this.cfg.get('app.maxUploadMb', 10);
        if (file.size > maxMb * 1024 * 1024)
            throw new common_1.BadRequestException(`File too large. Max ${maxMb}MB`);
        if (!file.mimetype.startsWith('image/'))
            throw new common_1.BadRequestException('Only image files allowed');
        const optimised = await sharp(file.buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload_stream({ folder: `solarhub/${folder}`, resource_type: 'image', format: 'webp' }, (err, result) => {
                if (err)
                    reject(new common_1.BadRequestException(err.message));
                else
                    resolve({ url: result.secure_url, publicId: result.public_id });
            }).end(optimised);
        });
    }
    async uploadMultiple(files, folder = 'general') {
        return Promise.all(files.map(f => this.uploadImage(f, folder)));
    }
    async uploadVideo(file, folder = 'general') {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const maxMb = 100;
        if (file.size > maxMb * 1024 * 1024)
            throw new common_1.BadRequestException(`Video too large. Max ${maxMb}MB`);
        if (!file.mimetype.startsWith('video/'))
            throw new common_1.BadRequestException('Only video files allowed');
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload_stream({ folder: `solarhub/${folder}`, resource_type: 'video' }, (err, result) => {
                if (err)
                    reject(new common_1.BadRequestException(err.message));
                else
                    resolve({ url: result.secure_url, publicId: result.public_id, resourceType: 'video' });
            }).end(file.buffer);
        });
    }
    async uploadMedia(file, folder = 'general') {
        if (file.mimetype.startsWith('video/'))
            return this.uploadVideo(file, folder);
        return { ...(await this.uploadImage(file, folder)), resourceType: 'image' };
    }
    async uploadMultipleMedia(files, folder = 'general') {
        return Promise.all(files.map(f => this.uploadMedia(f, folder)));
    }
    async uploadAvatar(file, folder = 'avatars') {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        if (!file.mimetype.startsWith('image/'))
            throw new common_1.BadRequestException('Only image files are allowed for avatars');
        const optimised = await sharp(file.buffer)
            .resize(400, 400, { fit: 'cover', position: 'centre' })
            .webp({ quality: 90 })
            .toBuffer();
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload_stream({ folder: `solarhub/${folder}`, resource_type: 'image', format: 'webp' }, (err, result) => {
                if (err)
                    reject(new common_1.BadRequestException(err.message));
                else
                    resolve({ url: result.secure_url, publicId: result.public_id });
            }).end(optimised);
        });
    }
    async deleteFile(publicId, resourceType = 'image') {
        await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
    }
    async extractSpecsFromLabel(file, category) {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const base64 = file.buffer.toString('base64');
        const mediaType = file.mimetype;
        const prompt = SPEC_PROMPTS[category] || SPEC_PROMPTS.accessories;
        try {
            const msg = await this.anthropic.messages.create({
                model: this.cfg.get('anthropic.model'),
                max_tokens: 1024,
                messages: [{
                        role: 'user',
                        content: [
                            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                            { type: 'text', text: prompt },
                        ],
                    }],
            });
            const text = msg.content[0].text || '{}';
            const cleaned = text.replace(/```json|```/g, '').trim();
            const match = cleaned.match(/\{[\s\S]+\}/);
            return match ? JSON.parse(match[0]) : {};
        }
        catch (err) {
            this.logger.error('AI spec extraction failed:', err.message);
            return {};
        }
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map