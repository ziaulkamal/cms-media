/**
 * src/modules/venue-content/venue-content.module.ts
 * Modul VenueContent: pengayaan venue + proxy daftar venue simpora2026.
 */
import { Module } from '@nestjs/common';
import { VenueContentController } from './venue-content.controller';
import { VenueContentRepository } from './venue-content.repository';
import { VenueContentService } from './venue-content.service';

@Module({
  controllers: [VenueContentController],
  providers: [VenueContentService, VenueContentRepository],
})
export class VenueContentModule {}
