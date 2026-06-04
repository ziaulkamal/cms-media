/** admin/src/composables/useSettings.ts — server-state setting situs (ADMIN). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { settingsApi } from '@/api/settings';
import type { UpsertSettingPayload } from '@/types/cms';

/** Daftar lengkap setting. */
export function useSettingsQuery() {
  return useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.list() });
}

/** Map setting publik (site_url, permalink_structure, dst.) untuk preview permalink. */
export function usePublicSettingsQuery() {
  return useQuery({
    queryKey: ['settings-public'],
    queryFn: () => settingsApi.publicMap(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Mutasi setting; invalidate daftar pada sukses. */
export function useSettingMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['settings'] });

  return {
    bulkUpdate: useMutation({
      mutationFn: (values: Record<string, unknown>) => settingsApi.bulkUpdate(values),
      onSuccess: invalidate,
    }),
    upsert: useMutation({
      mutationFn: (vars: { key: string; payload: UpsertSettingPayload }) =>
        settingsApi.upsert(vars.key, vars.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (key: string) => settingsApi.remove(key),
      onSuccess: invalidate,
    }),
  };
}
