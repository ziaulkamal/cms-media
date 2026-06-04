/**
 * src/modules/media/media.service.ts
 * Aturan bisnis Media: validasi mime/size, simpan via StoragePort, kelola metadata.
 */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Media, UserRole } from '@prisma/client';
import { paginate } from '../../common/dto/paginated';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { Paginated } from '../../common/interceptors/response.interceptor';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { MediaRepository } from './media.repository';
import { MediaView, toMediaView } from './entities/media.entity';
import { STORAGE_PORT, StoragePort } from './storage/storage-port';

/** Tipe MIME gambar yang diizinkan untuk diunggah. */
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Peran yang boleh menghapus media milik siapa pun. */
const EDITORIAL_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.EDITOR];

/** Service Media: orkestrasi unggah/hapus berkas + metadata. */
@Injectable()
export class MediaService {
  private readonly maxSizeBytes: number;

  constructor(
    private readonly repo: MediaRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    config: ConfigService,
  ) {
    this.maxSizeBytes =
      config.get<number>('storage.maxSizeBytes') ?? 10_485_760;
  }

  /** Validasi & simpan berkas, lalu catat metadatanya. */
  async upload(
    file: Express.Multer.File | undefined,
    user: AuthenticatedUser,
    alt?: string,
  ): Promise<MediaView> {
    if (!file) throw new ValidationError('Berkas wajib diunggah.');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new ValidationError('Tipe berkas tidak didukung (hanya gambar).');
    }
    if (file.size > this.maxSizeBytes) {
      throw new ValidationError('Ukuran berkas melebihi batas.');
    }

    const key = await this.storage.save({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });

    const media = await this.repo.create({
      storageKey: key,
      mimeType: file.mimetype,
      size: file.size,
      alt,
      uploadedBy: { connect: { id: user.id } },
    });
    return toMediaView(media);
  }

  /** Daftar media ber-paginasi. */
  async list(page: number, perPage: number): Promise<Paginated<MediaView>> {
    const [items, total] = await this.repo.paginate(
      (page - 1) * perPage,
      perPage,
    );
    return paginate(items.map(toMediaView), total, page, perPage);
  }

  /** Ambil satu media. */
  async getById(id: string): Promise<MediaView> {
    return toMediaView(await this.getOrFail(id));
  }

  /** Hapus media: catatan DB dulu, lalu berkas fisik (best-effort). */
  async remove(id: string, user: AuthenticatedUser): Promise<{ id: string }> {
    const media = await this.getOrFail(id);
    this.assertCanManage(media, user);
    await this.repo.delete(id);
    await this.storage.delete(media.storageKey);
    return { id };
  }

  private async getOrFail(id: string): Promise<Media> {
    const media = await this.repo.findById(id);
    if (!media) throw new NotFoundError('Media tidak ditemukan.');
    return media;
  }

  /** AuthZ: editor ke atas boleh semua; selain itu hanya pengunggah. */
  private assertCanManage(media: Media, user: AuthenticatedUser): void {
    const isEditorial = EDITORIAL_ROLES.includes(user.role);
    if (!isEditorial && media.uploadedById !== user.id) {
      throw new ForbiddenError('Anda bukan pengunggah media ini.');
    }
  }
}
