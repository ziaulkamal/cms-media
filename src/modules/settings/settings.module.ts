/**
 * src/modules/settings/settings.module.ts
 * Modul Settings: konfigurasi situs dinamis (key-value). SettingsService diekspor
 * agar modul lain dapat membaca konfigurasi bila diperlukan.
 */
import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService],
})
export class SettingsModule {}
