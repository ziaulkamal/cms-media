/**
 * src/modules/gallery/gallery.service.ts
 * Aturan bisnis Gallery: foto (publik & admin) + album, dengan auto-orientasi.
 */
import { Injectable } from '@nestjs/common';
import { PhotoOrientation, Prisma } from '@prisma/client';
import { paginate } from '../../common/dto/paginated';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { Paginated } from '../../common/interceptors/response.interceptor';
import { slugify } from '../../common/utils/slug';
import { CreateAlbumDto, UpdateAlbumDto } from './dto/album.dto';
import { CreateGalleryPhotoDto } from './dto/create-gallery-photo.dto';
import { GalleryQueryDto } from './dto/gallery-query.dto';
import { UpdateGalleryPhotoDto } from './dto/update-gallery-photo.dto';
import {
  GalleryAlbumView,
  toGalleryAlbumView,
} from './entities/gallery-album.entity';
import {
  GalleryPhotoPublicView,
  GalleryPhotoView,
  toGalleryPhotoPublicView,
  toGalleryPhotoView,
} from './entities/gallery-photo.entity';
import { GalleryRepository } from './gallery.repository';

/** Turunkan orientasi dari dimensi media (default LANSKAP bila tak diketahui). */
function deriveOrientation(
  dims: { width: number | null; height: number | null } | null,
): PhotoOrientation {
  if (!dims?.width || !dims?.height) return PhotoOrientation.LANSKAP;
  if (dims.width > dims.height) return PhotoOrientation.LANSKAP;
  if (dims.width < dims.height) return PhotoOrientation.POTRET;
  return PhotoOrientation.KOTAK;
}

/** Service Gallery: orkestrasi foto & album galeri. */
@Injectable()
export class GalleryService {
  constructor(private readonly repo: GalleryRepository) {}

  // --- Foto ---

  /** Daftar foto publik (published) dgn filter kategori/album. */
  async listPublic(
    query: GalleryQueryDto,
  ): Promise<Paginated<GalleryPhotoPublicView>> {
    const [items, total] = await this.repo.paginatePublic(
      { category: query.category, albumId: query.album },
      query.skip,
      query.perPage,
    );
    return paginate(
      items.map(toGalleryPhotoPublicView),
      total,
      query.page,
      query.perPage,
    );
  }

  /** Daftar foto untuk admin (semua status, field lengkap). */
  async listManage(
    page: number,
    perPage: number,
  ): Promise<Paginated<GalleryPhotoView>> {
    const [items, total] = await this.repo.paginateAll(
      (page - 1) * perPage,
      perPage,
    );
    return paginate(items.map(toGalleryPhotoView), total, page, perPage);
  }

  /** Daftarkan foto dari aset Media; auto-orientasi bila tak diberikan. */
  async createPhoto(dto: CreateGalleryPhotoDto): Promise<GalleryPhotoView> {
    const dims = await this.repo.findMediaDims(dto.mediaId);
    if (!dims) throw new ValidationError('Media tidak ditemukan.');

    const photo = await this.repo.createPhoto({
      media: { connect: { id: dto.mediaId } },
      album: dto.albumId ? { connect: { id: dto.albumId } } : undefined,
      caption: dto.caption,
      category: dto.category,
      orientation: dto.orientation ?? deriveOrientation(dims),
      sortOrder: dto.sortOrder ?? 0,
      isPublished: dto.isPublished ?? true,
    });
    return toGalleryPhotoView(photo);
  }

  /** Ubah metadata foto galeri. */
  async updatePhoto(
    id: string,
    dto: UpdateGalleryPhotoDto,
  ): Promise<GalleryPhotoView> {
    await this.getPhotoOrFail(id);
    const data: Prisma.GalleryPhotoUpdateInput = {
      caption: dto.caption,
      category: dto.category,
      orientation: dto.orientation,
      sortOrder: dto.sortOrder,
      isPublished: dto.isPublished,
    };
    if (dto.albumId !== undefined) {
      data.album = dto.albumId
        ? { connect: { id: dto.albumId } }
        : { disconnect: true };
    }
    return toGalleryPhotoView(await this.repo.updatePhoto(id, data));
  }

  /** Hapus foto galeri (tidak menghapus berkas media induk). */
  async removePhoto(id: string): Promise<{ id: string }> {
    await this.getPhotoOrFail(id);
    return this.repo.deletePhoto(id);
  }

  /** Hapus banyak foto galeri sekaligus (berkas media tetap di Media Library). */
  async bulkRemovePhotos(ids: string[]): Promise<{ deleted: number }> {
    return { deleted: await this.repo.deletePhotos(ids) };
  }

  private async getPhotoOrFail(id: string): Promise<void> {
    const photo = await this.repo.findPhotoById(id);
    if (!photo) throw new NotFoundError('Foto galeri tidak ditemukan.');
  }

  // --- Album ---

  /** Daftar album (publik & admin sama; ringkas dgn cover & jumlah foto). */
  async listAlbums(): Promise<GalleryAlbumView[]> {
    return (await this.repo.listAlbums()).map(toGalleryAlbumView);
  }

  /** Buat album baru dengan slug unik dari judul. */
  async createAlbum(dto: CreateAlbumDto): Promise<GalleryAlbumView> {
    const slug = slugify(dto.title);
    if (await this.repo.albumSlugTaken(slug)) {
      throw new ConflictError('Album dengan judul serupa sudah ada.');
    }
    const album = await this.repo.createAlbum({
      slug,
      title: dto.title,
      coverMedia: dto.coverMediaId
        ? { connect: { id: dto.coverMediaId } }
        : undefined,
    });
    return this.albumViewById(album.id);
  }

  /** Ubah album (judul → slug ikut diperbarui bila berubah). */
  async updateAlbum(
    id: string,
    dto: UpdateAlbumDto,
  ): Promise<GalleryAlbumView> {
    await this.getAlbumOrFail(id);
    const data: Prisma.GalleryAlbumUpdateInput = {};
    if (dto.title !== undefined) {
      const slug = slugify(dto.title);
      if (await this.repo.albumSlugTaken(slug, id)) {
        throw new ConflictError('Album dengan judul serupa sudah ada.');
      }
      data.title = dto.title;
      data.slug = slug;
    }
    if (dto.coverMediaId !== undefined) {
      data.coverMedia = dto.coverMediaId
        ? { connect: { id: dto.coverMediaId } }
        : { disconnect: true };
    }
    await this.repo.updateAlbum(id, data);
    return this.albumViewById(id);
  }

  /** Hapus album (foto di dalamnya tidak terhapus; albumId di-set null). */
  async removeAlbum(id: string): Promise<{ id: string }> {
    await this.getAlbumOrFail(id);
    return this.repo.deleteAlbum(id);
  }

  private async getAlbumOrFail(id: string): Promise<void> {
    const album = await this.repo.findAlbumById(id);
    if (!album) throw new NotFoundError('Album tidak ditemukan.');
  }

  /** Ambil view album tunggal (cover + jumlah foto). */
  private async albumViewById(id: string): Promise<GalleryAlbumView> {
    const found = await this.repo.findAlbumWithRelations(id);
    if (!found) throw new NotFoundError('Album tidak ditemukan.');
    return toGalleryAlbumView(found);
  }
}
