/** admin/src/composables/useDev.ts — server-state tools dummy seeder. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { devApi } from '@/api/dev';
import type { GenerateDummyPayload } from '@/types/cms';

/** Daftar query yang ikut disegarkan saat data dummy berubah. */
const AFFECTED = [
  'dummy-stats',
  'gallery',
  'gallery-albums',
  'articles',
  'comments',
  'categories',
  'tags',
  'live-streams',
  'streaming-enabled',
  'venue-content',
  'contact',
];

/** Statistik data dummy saat ini. */
export function useDummyStatsQuery() {
  return useQuery({
    queryKey: ['dummy-stats'],
    queryFn: () => devApi.stats(),
  });
}

/** Mutasi generate/clear; invalidate stats + daftar terdampak pada sukses. */
export function useDevMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    for (const key of AFFECTED) void qc.invalidateQueries({ queryKey: [key] });
  };

  return {
    generate: useMutation({
      mutationFn: (payload: GenerateDummyPayload) => devApi.generate(payload),
      onSuccess: invalidate,
    }),
    clear: useMutation({
      mutationFn: () => devApi.clear(),
      onSuccess: invalidate,
    }),
  };
}
