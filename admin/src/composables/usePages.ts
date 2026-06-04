/** admin/src/composables/usePages.ts — server-state halaman statis (list, detail, mutasi). */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { computed, type ComputedRef } from 'vue';
import { pagesApi } from '@/api/pages';
import type { CreatePagePayload, PageQuery, UpdatePagePayload } from '@/types/cms';

/** Daftar halaman (reaktif terhadap filter/paginasi). */
export function usePagesQuery(params: ComputedRef<PageQuery>) {
  return useQuery({
    queryKey: ['pages', params],
    queryFn: () => pagesApi.list(params.value),
    placeholderData: keepPreviousData,
  });
}

/** Detail satu halaman untuk editor (enabled saat id ada). */
export function usePageDetail(id: ComputedRef<string | undefined>) {
  return useQuery({
    queryKey: ['page-detail', id],
    enabled: computed(() => !!id.value),
    queryFn: () => pagesApi.get(id.value as string),
  });
}

/** Mutasi halaman; invalidate daftar & detail pada sukses. */
export function usePageMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['pages'] });
    void qc.invalidateQueries({ queryKey: ['page-detail'] });
  };

  return {
    create: useMutation({
      mutationFn: (payload: CreatePagePayload) => pagesApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdatePagePayload }) =>
        pagesApi.update(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => pagesApi.remove(id),
      onSuccess: invalidate,
    }),
  };
}
