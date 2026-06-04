/**
 * admin/src/lib/labels.ts
 * Label Bahasa Indonesia + varian badge untuk enum domain (dipakai lintas modul).
 */
import type { BadgeVariant } from '@/components/ui/Badge.vue';
import type {
  AdCreativeKind,
  AdCreativeStatus,
  AdPlatform,
  ArticleStatus,
  CommentStatus,
  PageStatus,
  SettingType,
  UserRole,
} from '@/types/cms';

export const articleStatusLabel: Record<ArticleStatus, string> = {
  DRAFT: 'Draf',
  IN_REVIEW: 'Direview',
  SCHEDULED: 'Terjadwal',
  PUBLISHED: 'Terbit',
  ARCHIVED: 'Arsip',
};

export const articleStatusVariant: Record<ArticleStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  IN_REVIEW: 'warning',
  SCHEDULED: 'info',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

export const commentStatusLabel: Record<CommentStatus, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  SPAM: 'Spam',
};

export const commentStatusVariant: Record<CommentStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  SPAM: 'danger',
};

export const adKindLabel: Record<AdCreativeKind, string> = {
  HOUSE_IMAGE: 'Banner Gambar',
  HOUSE_HTML: 'HTML Custom',
  ADSENSE: 'Google AdSense',
};

export const adPlatformLabel: Record<AdPlatform, string> = {
  WEB: 'Web',
  AMP: 'AMP',
  BOTH: 'Web + AMP',
};

export const adStatusLabel: Record<AdCreativeStatus, string> = {
  DRAFT: 'Draf',
  SCHEDULED: 'Terjadwal',
  ACTIVE: 'Aktif',
  PAUSED: 'Dijeda',
  EXPIRED: 'Kedaluwarsa',
  ARCHIVED: 'Arsip',
};

export const adStatusVariant: Record<AdCreativeStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  SCHEDULED: 'info',
  ACTIVE: 'success',
  PAUSED: 'warning',
  EXPIRED: 'danger',
  ARCHIVED: 'neutral',
};

export const pageStatusLabel: Record<PageStatus, string> = {
  DRAFT: 'Draf',
  PUBLISHED: 'Terbit',
};

export const pageStatusVariant: Record<PageStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
};

export const userRoleLabel: Record<UserRole, string> = {
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  AUTHOR: 'Penulis',
  CONTRIBUTOR: 'Kontributor',
};

export const settingTypeLabel: Record<SettingType, string> = {
  STRING: 'Teks singkat',
  TEXT: 'Teks panjang',
  NUMBER: 'Angka',
  BOOLEAN: 'Boolean',
  JSON: 'JSON',
  URL: 'URL',
};

/** Bantu bangun opsi {value,label} untuk SelectInput dari peta label. */
export function toOptions<T extends string>(
  map: Record<T, string>,
): Array<{ value: T; label: string }> {
  return (Object.keys(map) as T[]).map((value) => ({ value, label: map[value] }));
}
