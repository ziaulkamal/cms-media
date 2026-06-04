/**
 * admin/src/composables/useFilters.ts
 * Filter daftar yang tersinkron ke query string; ganti filter mereset page ke 1.
 */
import { computed, type WritableComputedRef } from 'vue';
import {
  type LocationQuery,
  type LocationQueryRaw,
  useRoute,
  useRouter,
} from 'vue-router';

/** Hapus entri undefined/empty agar URL tetap bersih. */
export function cleanQuery(query: LocationQueryRaw): LocationQueryRaw {
  const result: LocationQueryRaw = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }
  return result;
}

/** Satu parameter filter sebagai computed dua-arah (reset page saat berubah). */
export function useQueryParam(
  key: string,
  defaultValue = '',
): WritableComputedRef<string> {
  const route = useRoute();
  const router = useRouter();

  return computed<string>({
    get: () => (route.query[key] as string | undefined) ?? defaultValue,
    set: (value) =>
      void router.replace({
        query: cleanQuery({
          ...route.query,
          [key]: value || undefined,
          page: undefined,
        }),
      }),
  });
}

/** Snapshot seluruh query saat ini (untuk diteruskan ke API). */
export function useCurrentQuery(): { query: LocationQuery } {
  const route = useRoute();
  return { query: route.query };
}
