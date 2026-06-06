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
import { slugify } from '../../common/utils/slug';
import { UpdateMediaDto } from './dto/update-media.dto';
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

    // Judul default: slug dari nama file (tanpa ekstensi) bila tak diberikan.
    const baseName = file.originalname.replace(/\.[^.]+$/, '');
    const title = slugify(baseName) || 'gambar';

    const media = await this.repo.create({
      storageKey: key,
      mimeType: file.mimetype,
      size: file.size,
      title,
      alt,
      uploadedBy: { connect: { id: user.id } },
    });
    return toMediaView(media);
  }

  /** Ubah metadata media (judul/deskripsi/alt); pengunggah atau editor ke atas. */
  async updateMeta(
    id: string,
    dto: UpdateMediaDto,
    user: AuthenticatedUser,
  ): Promise<MediaView> {
    const media = await this.getOrFail(id);
    this.assertCanManage(media, user);
    const updated = await this.repo.update(id, {
      title: dto.title,
      description: dto.description,
      alt: dto.alt,
    });
    return toMediaView(updated);
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

  /** Hapus banyak media sekaligus (+ berkas storage-nya); editor ke atas. */
  async bulkRemove(ids: string[], user: AuthenticatedUser): Promise<{ deleted: number }> {
    const items = await this.repo.findManyByIds(ids);
    for (const m of items) this.assertCanManage(m, user);
    const deleted = await this.repo.deleteMany(items.map((m) => m.id));
    // Hapus berkas fisik setelah record terhapus (abaikan kegagalan per-berkas).
    await Promise.all(items.map((m) => this.storage.delete(m.storageKey)));
    return { deleted };
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
