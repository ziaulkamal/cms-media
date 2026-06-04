/**
 * src/modules/ads/ads.module.ts
 * Modul Ads: controller + service + repository slot iklan & creative.
 */
import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsRepository } from './ads.repository';
import { AdsService } from './ads.service';

@Module({
  controllers: [AdsController],
  providers: [AdsService, AdsRepository],
})
export class AdsModule {}
