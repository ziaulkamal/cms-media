/**
 * src/modules/live-streams/entities/live-stream.entity.ts
 * View & mapper LiveStream: bentuk publik (FE, key Indonesia) vs admin lengkap.
 */
import { LiveStream } from '@prisma/client';

/** Kanal siaran untuk FE PORA (key dalam Bahasa Indonesia). */
export interface LiveStreamPublicView {
  id: string;
  youtubeId: string;
  cabor: string | null;
  judul: string;
  venue: string | null;
  penonton: number;
  live: boolean;
}

/** Bentuk admin lengkap untuk panel pengelolaan kanal. */
export interface LiveStreamView {
  id: string;
  youtubeId: string;
  sportName: string | null;
  matchRef: string | null;
  title: string;
  venueName: string | null;
  viewerCount: number;
  isLive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Petakan ke bentuk publik. */
export function toLiveStreamPublicView(s: LiveStream): LiveStreamPublicView {
  return {
    id: s.id,
    youtubeId: s.youtubeId,
    cabor: s.sportName,
    judul: s.title,
    venue: s.venueName,
    penonton: s.viewerCount,
    live: s.isLive,
  };
}

/** Petakan ke bentuk admin lengkap. */
export function toLiveStreamView(s: LiveStream): LiveStreamView {
  return {
    id: s.id,
    youtubeId: s.youtubeId,
    sportName: s.sportName,
    matchRef: s.matchRef,
    title: s.title,
    venueName: s.venueName,
    viewerCount: s.viewerCount,
    isLive: s.isLive,
    sortOrder: s.sortOrder,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}
