/** admin/src/composables/useVenueContent.ts — server-state pengayaan venue. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { venueContentApi } from '@/api/venueContent';
import type { UpsertVenueContentPayload } from '@/types/cms';

/** Daftar konten venue. */
export function useVenueContentQuery() {
  return useQuery({
    queryKey: ['venue-content'],
    queryFn: () => venueContentApi.list(),
  });
}

/** Daftar venue dari simpora2026 (dropdown; read-only). */
export function useVenueSourcesQuery() {
  return useQuery({
    queryKey: ['venue-sources'],
    queryFn: () => venueContentApi.sources(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Mutasi konten venue; invalidate daftar pada sukses. */
export function useVenueContentMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ['venue-content'] });

  return {
    upsert: useMutation({
      mutationFn: (payload: UpsertVenueContentPayload) =>
        venueContentApi.upsert(payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (ref: string) => venueContentApi.remove(ref),
      onSuccess: invalidate,
    }),
  };
}
