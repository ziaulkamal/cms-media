/**
 * src/modules/gallery/gallery.repository.ts
 * Akses data GalleryPhoto & GalleryAlbum terpusat (query Prisma).
 */
import { Injectable } from '@nestjs/common';
import { GalleryAlbum, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  galleryAlbumInclude,
  GalleryAlbumWithRelations,
} from './entities/gallery-album.entity';
import {
  galleryPhotoInclude,
  GalleryPhotoWithMedia,
} from './entities/gallery-photo.entity';

/** Repository Gallery: pembungkus query foto & album. */
@Injectable()
export class GalleryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Foto ---

  createPhoto(
    data: Prisma.GalleryPhotoCreateInput,
  ): Promise<GalleryPhotoWithMedia> {
    return this.prisma.galleryPhoto.create({
      data,
      include: galleryPhotoInclude,
    });
  }

  findPhotoById(id: string): Promise<GalleryPhotoWithMedia | null> {
    return this.prisma.galleryPhoto.findUnique({
      where: { id },
      include: galleryPhotoInclude,
    });
  }

  updatePhoto(
    id: string,
    data: Prisma.GalleryPhotoUpdateInput,
  ): Promise<GalleryPhotoWithMedia> {
    return this.prisma.galleryPhoto.update({
      where: { id },
      data,
      include: galleryPhotoInclude,
    });
  }

  deletePhoto(id: string): Promise<{ id: string }> {
    return this.prisma.galleryPhoto.delete({
      where: { id },
      select: { id: true },
    });
  }

  async deletePhotos(ids: string[]): Promise<number> {
    const { count } = await this.prisma.galleryPhoto.deleteMany({
      where: { id: { in: ids } },
    });
    return count;
  }

  /** Daftar foto publik (published) dgn filter kategori/album, urut tampilan. */
  async paginatePublic(
    filter: { category?: string; albumId?: string },
    skip: number,
    take: number,
  ): Promise<[GalleryPhotoWithMedia[], number]> {
    const where: Prisma.GalleryPhotoWhereInput = {
      isPublished: true,
      category: filter.category,
      albumId: filter.albumId,
    };
    return this.prisma.$transaction([
      this.prisma.galleryPhoto.findMany({
        where,
        include: galleryPhotoInclude,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.galleryPhoto.count({ where }),
    ]);
  }

  /** Daftar foto untuk admin (semua status). */
  async paginateAll(
    skip: number,
    take: number,
  ): Promise<[GalleryPhotoWithMedia[], number]> {
    return this.prisma.$transaction([
      this.prisma.galleryPhoto.findMany({
        include: galleryPhotoInclude,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.galleryPhoto.count(),
    ]);
  }

  /** Dimensi media (untuk auto-orientasi); null bila media tak ada. */
  findMediaDims(
    id: string,
  ): Promise<{ width: number | null; height: number | null } | null> {
    return this.prisma.media.findUnique({
      where: { id },
      select: { width: true, height: true },
    });
  }

  // --- Album ---

  createAlbum(data: Prisma.GalleryAlbumCreateInput): Promise<GalleryAlbum> {
    return this.prisma.galleryAlbum.create({ data });
  }

  findAlbumById(id: string): Promise<GalleryAlbum | null> {
    return this.prisma.galleryAlbum.findUnique({ where: { id } });
  }

  updateAlbum(
    id: string,
    data: Prisma.GalleryAlbumUpdateInput,
  ): Promise<GalleryAlbum> {
    return this.prisma.galleryAlbum.update({ where: { id }, data });
  }

  deleteAlbum(id: string): Promise<{ id: string }> {
    return this.prisma.galleryAlbum.delete({
      where: { id },
      select: { id: true },
    });
  }

  findAlbumWithRelations(
    id: string,
  ): Promise<GalleryAlbumWithRelations | null> {
    return this.prisma.galleryAlbum.findUnique({
      where: { id },
      include: galleryAlbumInclude,
    });
  }

  listAlbums(): Promise<GalleryAlbumWithRelations[]> {
    return this.prisma.galleryAlbum.findMany({
      include: galleryAlbumInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Apakah slug album sudah dipakai (selain id tertentu)? */
  async albumSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
    const found = await this.prisma.galleryAlbum.findFirst({
      where: { slug, id: exceptId ? { not: exceptId } : undefined },
      select: { id: true },
    });
    return found !== null;
  }
}
