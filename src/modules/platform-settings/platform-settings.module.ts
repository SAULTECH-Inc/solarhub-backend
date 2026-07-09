import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSetting } from './platform-setting.entity';
import { PlatformSettingsService } from './platform-settings.service';
import { PublicController } from './public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformSetting])],
  providers: [PlatformSettingsService],
  controllers: [PublicController],
  exports: [PlatformSettingsService],
})
export class PlatformSettingsModule {}
