/**
 * src/modules/dashboard/dashboard.controller.ts
 * Endpoint ringkasan dashboard (semua staf terautentikasi).
 */
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

/** Route dashboard; tanpa @Roles → semua staf terautentikasi boleh akses. */
@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /** Ringkasan metrik CMS dalam satu request. */
  @Get('stats')
  stats() {
    return this.dashboard.getStats();
  }
}
