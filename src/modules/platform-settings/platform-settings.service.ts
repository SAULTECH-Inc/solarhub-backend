import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from './platform-setting.entity';

const DEFAULTS: Record<string, { value: string; description: string }> = {
  escrow_enabled:            { value: 'false', description: 'Enable/disable the escrow payment feature' },
  escrow_fee_percent:        { value: '1.5',   description: 'Platform fee percentage deducted from escrow on release' },
  escrow_auto_release_days:  { value: '7',     description: 'Days after seller ships before funds auto-release to seller' },
  escrow_dispute_window_days:{ value: '3',     description: 'Days buyer has after delivery confirmation to raise a dispute' },
};

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  private readonly logger = new Logger(PlatformSettingsService.name);

  constructor(
    @InjectRepository(PlatformSetting)
    private readonly repo: Repository<PlatformSetting>,
  ) {}

  async onModuleInit() {
    for (const [key, { value, description }] of Object.entries(DEFAULTS)) {
      const exists = await this.repo.findOne({ where: { key } });
      if (!exists) {
        await this.repo.save(this.repo.create({ key, value, description }));
        this.logger.log(`Platform setting seeded: ${key}=${value}`);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? DEFAULTS[key]?.value ?? null;
  }

  async getBoolean(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val === 'true';
  }

  async getNumber(key: string): Promise<number> {
    const val = await this.get(key);
    return parseFloat(val ?? '0');
  }

  async set(key: string, value: string): Promise<PlatformSetting> {
    let row = await this.repo.findOne({ where: { key } });
    if (!row) {
      row = this.repo.create({ key, value, description: DEFAULTS[key]?.description ?? null });
    } else {
      row.value = value;
    }
    return this.repo.save(row);
  }

  async getAll(): Promise<PlatformSetting[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }
}
