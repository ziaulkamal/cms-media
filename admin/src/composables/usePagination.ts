/**
 * admin/src/composables/usePagination.ts
 * State paginasi tersinkron query string router (shareable & back-button friendly).
 */
import { computed, type WritableComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cleanQuery } from './useFilters';

/** page & perPage sebagai computed dua-arah yang menulis ke query URL. */
export function usePagination(defaultPerPage = 20): {
  page: WritableComputedRef<number>;
  perPage: WritableComputedRef<number>;
} {
  const route = useRoute();
  const router = useRouter();

  const page = computed<number>({
    get: () => Number(route.query.page ?? 1),
    set: (v) =>
      void router.replace({
        query: cleanQuery({ ...route.query, page: v > 1 ? String(v) : undefined }),
      }),
  });

  const perPage = computed<number>({
    get: () => Number(route.query.perPage ?? defaultPerPage),
    set: (v) =>
      void router.replace({
        query: cleanQuery({
          ...route.query,
          perPage: String(v),
          page: undefined,
        }),
      }),
  });

  return { page, perPage };
}
