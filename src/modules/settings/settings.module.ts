/**
 * src/modules/settings/settings.module.ts
 * Modul Settings: konfigurasi situs dinamis (key-value). SettingsService diekspor
 * agar modul lain dapat membaca konfigurasi bila diperlukan.
 */
import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';

@Module({
  imports: [RealtimeModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService],
})
export class SettingsModule {}
