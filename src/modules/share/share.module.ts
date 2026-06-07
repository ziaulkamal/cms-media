/**
 * src/modules/share/share.module.ts
 * Modul Share: halaman OG untuk crawler sosial media (di luar prefix API).
 */
import { Module } from '@nestjs/common';
import { ArticlesModule } from '../articles/articles.module';
import { SettingsModule } from '../settings/settings.module';
import { ShareController } from './share.controller';

@Module({
  imports: [ArticlesModule, SettingsModule],
  controllers: [ShareController],
})
export class ShareModule {}
