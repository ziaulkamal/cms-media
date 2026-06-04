/**
 * src/modules/media/media.module.ts
 * Modul Media: controller + service + repository, dengan StoragePort terikat ke local.
 */
import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';
import { LocalStorageAdapter } from './storage/local-storage.adapter';
import { STORAGE_PORT } from './storage/storage-port';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaRepository,
    // Ganti baris ini dengan S3Adapter untuk pindah penyimpanan (tanpa ubah service).
    { provide: STORAGE_PORT, useClass: LocalStorageAdapter },
  ],
})
export class MediaModule {}
