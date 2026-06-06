/**
 * src/modules/gallery/entities/gallery-photo.entity.ts
 * View & mapper GalleryPhoto: bentuk publik ringkas (FE) vs bentuk admin lengkap.
 */
import { Prisma } from '@prisma/client';
import { mediaPublicUrl } from '../../../common/utils/media-url';

/** Relasi media yang selalu disertakan saat mengambil foto galeri. */
export const galleryPhotoInclude = {
  media: {
    select: { id: true, storageKey: true, width: true, height: true, alt: true },
  },
} satisfies Prisma.GalleryPhotoInclude;

/** Foto galeri beserta relasi media terpilih. */
export type GalleryPhotoWithMedia = Prisma.GalleryPhotoGetPayload<{
  include: typeof galleryPhotoInclude;
}>;

/** Bentuk publik yang dikonsumsi FE PORA (key dalam Bahasa Indonesia). */
export interface GalleryPhotoPublicView {
  id: string;
  src: string;
  caption: string | null;
  kategori: string | null;
  orientasi: string;
}

/** Bentuk admin lengkap untuk panel pengelolaan galeri. */
export interface GalleryPhotoView {
  id: string;
  mediaId: string;
  src: string;
  caption: string | null;
  category: string | null;
  orientation: string;
  albumId: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
}

/** Petakan ke bentuk publik (src dari media.url). */
export function toGalleryPhotoPublicView(
  p: GalleryPhotoWithMedia,
): GalleryPhotoPublicView {
  return {
    id: p.id,
    src: mediaPublicUrl(p.media.storageKey),
    caption: p.caption,
    kategori: p.category,
    orientasi: p.orientation,
  };
}

/** Petakan ke bentuk admin lengkap. */
export function toGalleryPhotoView(p: GalleryPhotoWithMedia): GalleryPhotoView {
  return {
    id: p.id,
    mediaId: p.mediaId,
    src: mediaPublicUrl(p.media.storageKey),
    caption: p.caption,
    category: p.category,
    orientation: p.orientation,
    albumId: p.albumId,
    sortOrder: p.sortOrder,
    isPublished: p.isPublished,
    createdAt: p.createdAt,
  };
}
