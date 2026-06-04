/**
 * src/modules/health/health.module.ts
 * Modul Health: endpoint kesehatan aplikasi & database.
 */
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
