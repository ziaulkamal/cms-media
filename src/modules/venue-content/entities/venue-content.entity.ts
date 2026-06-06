/**
 * src/modules/venue-content/entities/venue-content.entity.ts
 * View & mapper VenueContent: ekspos URL gambar utama dari relasi media.
 */
import { Prisma } from '@prisma/client';
import { mediaPublicUrl } from '../../../common/utils/media-url';

/** Relasi gambar utama yang disertakan saat mengambil venue content. */
export const venueContentInclude = {
  imageMedia: { select: { storageKey: true } },
} satisfies Prisma.VenueContentInclude;

/** VenueContent beserta relasi media. */
export type VenueContentWithMedia = Prisma.VenueContentGetPayload<{
  include: typeof venueContentInclude;
}>;

/** Representasi VenueContent untuk client. */
export interface VenueContentView {
  id: string;
  venueRef: string;
  description: string;
  imageUrl: string | null;
  gallery: unknown;
  galleryVisible: boolean;
  updatedAt: Date;
}

/** Petakan entity Prisma ke VenueContentView. */
export function toVenueContentView(
  v: VenueContentWithMedia,
): VenueContentView {
  return {
    id: v.id,
    venueRef: v.venueRef,
    description: v.description,
    imageUrl: v.imageMedia ? mediaPublicUrl(v.imageMedia.storageKey) : null,
    gallery: v.gallery,
    galleryVisible: v.galleryVisible,
    updatedAt: v.updatedAt,
  };
}
