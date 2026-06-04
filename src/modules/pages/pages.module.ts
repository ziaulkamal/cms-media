/**
 * src/modules/pages/pages.module.ts
 * Modul Pages: halaman statis (terpisah dari Article).
 */
import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesRepository } from './pages.repository';
import { PagesService } from './pages.service';

@Module({
  controllers: [PagesController],
  providers: [PagesService, PagesRepository],
})
export class PagesModule {}
