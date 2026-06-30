import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import Anthropic from '@anthropic-ai/sdk';
import * as sharp from 'sharp';

const SPEC_PROMPTS: Record<string, string> = {
  'solar-panels': 'Extract solar panel specs from this product label/datasheet. Return ONLY valid JSON with these keys if visible: brand, model, pmaxWp, vocV, vmpV, iscA, impA, efficiencyPct, tempCoeff, dimensionsMm, weightKg, cellCount, maxSysVoltage, certifications',
  batteries: 'Extract battery specs. Return ONLY valid JSON: brand, model, chemistry, capacityAh, voltageV, dodPct, cycleLife, chargeRate, dischargeRate, hasBms, weightKg, certifications',
  inverters: 'Extract inverter specs. Return ONLY valid JSON: brand, model, inverterType, continuousW, surgeW, efficiencyPct, dcInputV, acOutputV, noLoadW, transferMs, hasBuiltInMppt, hasGridFailover, communication, weightKg, certifications',
  'charge-controllers': 'Extract charge controller specs. Return ONLY valid JSON: brand, model, ctrlType, maxPvVocV, chargeCurrentA, maxEffPct, systemVoltage, communication, certifications',
  'solar-lights': 'Extract solar light specs. Return ONLY valid JSON: lumens, ledPowerW, colorTempK, panelW, batteryAh, lightingHrs, ipRating',
  accessories: 'Extract product specs from this label. Return ONLY valid JSON with any visible fields.',
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly cfg: ConfigService) {
    cloudinary.config({
      cloud_name: cfg.get('cloudinary.cloudName'),
      api_key:    cfg.get('cloudinary.apiKey'),
      api_secret: cfg.get('cloudinary.apiSecret'),
    });
    this.anthropic = new Anthropic({ apiKey: cfg.get('anthropic.apiKey') });
  }

  async uploadImage(file: Express.Multer.File, folder = 'general'): Promise<{ url: string; publicId: string }> {
    if (!file) throw new BadRequestException('No file provided');
    const maxMb = this.cfg.get<number>('app.maxUploadMb', 10);
    if (file.size > maxMb * 1024 * 1024) throw new BadRequestException(`File too large. Max ${maxMb}MB`);
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Only image files allowed');

    // Optimise with sharp before upload
    const optimised = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `solarhub/${folder}`, resource_type: 'image', format: 'webp' },
        (err, result) => {
          if (err) reject(new BadRequestException(err.message));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        },
      ).end(optimised);
    });
  }

  async uploadMultiple(files: Express.Multer.File[], folder = 'general') {
    return Promise.all(files.map(f => this.uploadImage(f, folder)));
  }

  async uploadVideo(file: Express.Multer.File, folder = 'general'): Promise<{ url: string; publicId: string; resourceType: string }> {
    if (!file) throw new BadRequestException('No file provided');
    const maxMb = 100;
    if (file.size > maxMb * 1024 * 1024) throw new BadRequestException(`Video too large. Max ${maxMb}MB`);
    if (!file.mimetype.startsWith('video/')) throw new BadRequestException('Only video files allowed');

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `solarhub/${folder}`, resource_type: 'video' },
        (err, result) => {
          if (err) reject(new BadRequestException(err.message));
          else resolve({ url: result.secure_url, publicId: result.public_id, resourceType: 'video' });
        },
      ).end(file.buffer);
    });
  }

  /** Upload image or video depending on mimetype */
  async uploadMedia(file: Express.Multer.File, folder = 'general') {
    if (file.mimetype.startsWith('video/')) return this.uploadVideo(file, folder);
    return { ...(await this.uploadImage(file, folder)), resourceType: 'image' };
  }

  async uploadMultipleMedia(files: Express.Multer.File[], folder = 'general') {
    return Promise.all(files.map(f => this.uploadMedia(f, folder)));
  }

  async uploadAvatar(file: Express.Multer.File, folder = 'avatars'): Promise<{ url: string; publicId: string }> {
    if (!file) throw new BadRequestException('No file provided');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Only image files are allowed for avatars');

    const optimised = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover', position: 'centre' })
      .webp({ quality: 90 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `solarhub/${folder}`, resource_type: 'image', format: 'webp' },
        (err, result) => {
          if (err) reject(new BadRequestException(err.message));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        },
      ).end(optimised);
    });
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  async extractSpecsFromLabel(file: Express.Multer.File, category: string): Promise<Record<string, any>> {
    if (!file) throw new BadRequestException('No file provided');
    const base64 = file.buffer.toString('base64');
    const mediaType = file.mimetype as any;
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

      const text = (msg.content[0] as any).text || '{}';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]+\}/);
      return match ? JSON.parse(match[0]) : {};
    } catch (err) {
      this.logger.error('AI spec extraction failed:', err.message);
      return {};
    }
  }
}
