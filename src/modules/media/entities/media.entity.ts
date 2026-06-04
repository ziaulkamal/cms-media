/**
 * src/modules/media/entities/media.entity.ts
 * View & mapper Media: ekspos URL publik, sembunyikan detail penyimpanan internal.
 */
import { Media } from '@prisma/client';
import { mediaPublicUrl } from '../../../common/utils/media-url';

/** Representasi Media yang aman untuk client (key internal -> url publik). */
export interface MediaView {
  id: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: Date;
}

/** Petakan entity Prisma ke MediaView; storageKey tidak dibocorkan mentah. */
export function toMediaView(m: Media): MediaView {
  return {
    id: m.id,
    url: mediaPublicUrl(m.storageKey),
    mimeType: m.mimeType,
    size: m.size,
    width: m.width,
    height: m.height,
    alt: m.alt,
    createdAt: m.createdAt,
  };
}
