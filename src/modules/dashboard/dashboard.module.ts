/**
 * src/modules/dashboard/dashboard.module.ts
 * Modul Dashboard: agregasi metrik ringkasan CMS (read-only).
 */
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
