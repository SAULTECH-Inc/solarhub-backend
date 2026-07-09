import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowTransaction } from './escrow.entity';
import { SellerBankAccount } from './seller-bank-account.entity';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { EscrowFeatureGuard } from './escrow-feature.guard';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EscrowTransaction, SellerBankAccount]),
    PlatformSettingsModule,
    NotificationsModule,
  ],
  providers: [EscrowService, EscrowFeatureGuard],
  controllers: [EscrowController],
  exports: [EscrowService],
})
export class EscrowModule {}
