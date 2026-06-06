/**
 * src/modules/gallery/entities/gallery-album.entity.ts
 * View & mapper GalleryAlbum: sertakan URL cover + jumlah foto.
 */
import { Prisma } from '@prisma/client';
import { mediaPublicUrl } from '../../../common/utils/media-url';

/** Relasi yang disertakan saat mengambil album (cover + hitung foto). */
export const galleryAlbumInclude = {
  coverMedia: { select: { storageKey: true } },
  _count: { select: { photos: true } },
} satisfies Prisma.GalleryAlbumInclude;

/** Album beserta relasi terpilih. */
export type GalleryAlbumWithRelations = Prisma.GalleryAlbumGetPayload<{
  include: typeof galleryAlbumInclude;
}>;

/** Representasi album untuk client. */
export interface GalleryAlbumView {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  photoCount: number;
  createdAt: Date;
}

/** Petakan entity Prisma ke GalleryAlbumView. */
export function toGalleryAlbumView(
  a: GalleryAlbumWithRelations,
): GalleryAlbumView {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    coverUrl: a.coverMedia ? mediaPublicUrl(a.coverMedia.storageKey) : null,
    photoCount: a._count.photos,
    createdAt: a.createdAt,
  };
}
