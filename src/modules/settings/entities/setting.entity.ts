/**
 * src/modules/settings/entities/setting.entity.ts
 * View & mapper Setting: bentuk lengkap (admin) dan map { key: value } (publik).
 */
import { Setting } from '@prisma/client';

/** Representasi setting lengkap untuk panel admin. */
export interface SettingView {
  id: string;
  key: string;
  value: unknown;
  type: string;
  group: string;
  label: string | null;
  isPublic: boolean;
  updatedAt: Date;
}

/** Petakan setting Prisma ke view admin. */
export function toSettingView(s: Setting): SettingView {
  return {
    id: s.id,
    key: s.key,
    value: s.value,
    type: s.type,
    group: s.group,
    label: s.label,
    isPublic: s.isPublic,
    updatedAt: s.updatedAt,
  };
}

/** Ringkas daftar setting menjadi map { key: value } (untuk konsumsi frontend). */
export function toValueMap(settings: Setting[]): Record<string, unknown> {
  return settings.reduce<Record<string, unknown>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}
