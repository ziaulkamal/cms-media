/**
 * src/modules/dev/dev.module.ts
 * Modul tools developer: generator data dummy untuk panel admin.
 */
import { Module } from '@nestjs/common';
import { NonProductionGuard } from '../../common/guards/non-production.guard';
import { LocalStorageAdapter } from '../media/storage/local-storage.adapter';
import { STORAGE_PORT } from '../media/storage/storage-port';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';

@Module({
  controllers: [DevController],
  providers: [
    DevService,
    NonProductionGuard,
    { provide: STORAGE_PORT, useClass: LocalStorageAdapter },
  ],
})
export class DevModule {}
