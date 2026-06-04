/**
 * src/modules/media/storage/local-storage.adapter.ts
 * Implementasi StoragePort berbasis filesystem lokal (mudah diganti S3 via DI).
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { mediaPublicUrl } from '../../../common/utils/media-url';
import { StorageFile, StoragePort } from './storage-port';

/** Simpan berkas ke direktori lokal terstruktur per tahun/bulan. */
@Injectable()
export class LocalStorageAdapter implements StoragePort {
  private readonly baseDir: string;

  constructor(config: ConfigService) {
    this.baseDir = config.get<string>('storage.localDir') ?? 'storage/uploads';
  }

  /** Tulis berkas ke disk; key = yyyy/mm/uuid.ext. */
  async save(file: StorageFile): Promise<string> {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const ext = extname(file.originalName).toLowerCase() || this.extFromMime(file.mimeType);
    const key = `${yyyy}/${mm}/${randomUUID()}${ext}`;

    const fullPath = join(this.baseDir, key);
    await fs.mkdir(join(this.baseDir, yyyy, mm), { recursive: true });
    await fs.writeFile(fullPath, file.buffer);
    return key;
  }

  /** Hapus berkas; abaikan bila sudah tidak ada. */
  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(join(this.baseDir, key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  publicUrl(key: string): string {
    return mediaPublicUrl(key);
  }

  /** Tebak ekstensi dari mime untuk berkas tanpa ekstensi. */
  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return map[mime] ?? '';
  }
}
