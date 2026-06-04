/**
 * src/modules/health/health.controller.ts
 * Health check publik: status aplikasi + konektivitas database.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/** Endpoint kesehatan untuk probe/monitoring (tanpa autentikasi). */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Laporkan status app + ping DB (SELECT 1). */
  @Public()
  @Get()
  async check() {
    const db = await this.pingDb();
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /** Cek koneksi database; kembalikan 'up'/'down' tanpa membocorkan detail. */
  private async pingDb(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }
}
