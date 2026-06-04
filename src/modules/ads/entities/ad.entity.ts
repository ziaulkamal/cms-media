/**
 * src/modules/ads/entities/ad.entity.ts
 * View & mapper Ads: bentuk lengkap untuk kelola, bentuk serve per-kind (AMP-aware).
 */
import { AdCreative, AdSlot } from '@prisma/client';

/** Representasi slot untuk panel kelola. */
export interface AdSlotView {
  id: string;
  key: string;
  name: string;
  description: string | null;
  width: number | null;
  height: number | null;
  isAmpEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
}

/** Representasi creative lengkap untuk panel kelola. */
export interface AdCreativeView {
  id: string;
  slotId: string;
  kind: string;
  platform: string;
  status: string;
  name: string;
  imageUrl: string | null;
  targetUrl: string | null;
  alt: string | null;
  htmlSnippet: string | null;
  adClient: string | null;
  adSlot: string | null;
  adFormat: string | null;
  width: number | null;
  height: number | null;
  priority: number;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
}

/**
 * Bentuk serve untuk frontend: cukup data agar renderer merakit tag yang tepat
 * (HOUSE_IMAGE/HOUSE_HTML/ADSENSE) di lingkungan WEB maupun AMP.
 */
export interface AdServeView {
  id: string;
  kind: string;
  platform: string;
  width: number | null;
  height: number | null;
  // HOUSE_IMAGE
  imageUrl: string | null;
  targetUrl: string | null;
  alt: string | null;
  // HOUSE_HTML
  htmlSnippet: string | null;
  // ADSENSE
  adClient: string | null;
  adSlot: string | null;
  adFormat: string | null;
}

/** Petakan slot Prisma ke view kelola. */
export function toAdSlotView(s: AdSlot): AdSlotView {
  return {
    id: s.id,
    key: s.key,
    name: s.name,
    description: s.description,
    width: s.width,
    height: s.height,
    isAmpEnabled: s.isAmpEnabled,
    isActive: s.isActive,
    createdAt: s.createdAt,
  };
}

/** Petakan creative Prisma ke view kelola. */
export function toAdCreativeView(c: AdCreative): AdCreativeView {
  return {
    id: c.id,
    slotId: c.slotId,
    kind: c.kind,
    platform: c.platform,
    status: c.status,
    name: c.name,
    imageUrl: c.imageUrl,
    targetUrl: c.targetUrl,
    alt: c.alt,
    htmlSnippet: c.htmlSnippet,
    adClient: c.adClient,
    adSlot: c.adSlot,
    adFormat: c.adFormat,
    width: c.width,
    height: c.height,
    priority: c.priority,
    startAt: c.startAt,
    endAt: c.endAt,
    createdAt: c.createdAt,
  };
}

/** Petakan creative ke bentuk serve; dimensi jatuh ke ukuran slot bila kosong. */
export function toAdServeView(c: AdCreative, slot: AdSlot): AdServeView {
  return {
    id: c.id,
    kind: c.kind,
    platform: c.platform,
    width: c.width ?? slot.width,
    height: c.height ?? slot.height,
    imageUrl: c.imageUrl,
    targetUrl: c.targetUrl,
    alt: c.alt,
    htmlSnippet: c.htmlSnippet,
    adClient: c.adClient,
    adSlot: c.adSlot,
    adFormat: c.adFormat,
  };
}
