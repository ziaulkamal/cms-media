/** admin/src/api/settings.ts — endpoint setting situs dinamis (khusus ADMIN). */
import type {
  Setting,
  SuccessEnvelope,
  UpsertSettingPayload,
} from '@/types/cms';
import { http, unwrap } from './http';

export const settingsApi = {
  /** Map { key: value } setting publik (tanpa auth) — dipakai preview permalink. */
  publicMap: () =>
    unwrap<Record<string, unknown>>(
      http.get<SuccessEnvelope<Record<string, unknown>>>('/settings/public'),
    ),

  list: () => unwrap<Setting[]>(http.get<SuccessEnvelope<Setting[]>>('/settings')),

  get: (key: string) =>
    unwrap<Setting>(http.get<SuccessEnvelope<Setting>>(`/settings/${key}`)),

  /** Update massal nilai setting yang sudah ada. */
  bulkUpdate: (values: Record<string, unknown>) =>
    unwrap<{ updated: number }>(
      http.patch<SuccessEnvelope<{ updated: number }>>('/settings', { values }),
    ),

  /** Tambah/ubah satu setting via key. */
  upsert: (key: string, payload: UpsertSettingPayload) =>
    unwrap<Setting>(
      http.put<SuccessEnvelope<Setting>>(`/settings/${key}`, payload),
    ),

  remove: (key: string) =>
    unwrap<{ key: string }>(
      http.delete<SuccessEnvelope<{ key: string }>>(`/settings/${key}`),
    ),
};
