/** admin/src/composables/useMedia.ts — server-state media (list ber-paginasi, upload, hapus). */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { mediaApi } from '@/api/media';
import type { UpdateMediaPayload } from '@/types/cms';

/** Daftar media ber-paginasi (page reaktif: ref/computed/getter). */
export function useMediaQuery(page: MaybeRefOrGetter<number>, perPage = 24) {
  const pageRef = computed(() => toValue(page));
  return useQuery({
    queryKey: ['media', pageRef, perPage],
    queryFn: () => mediaApi.list(pageRef.value, perPage),
    placeholderData: keepPreviousData,
  });
}

/** Mutasi media; invalidate daftar pada sukses. */
export function useMediaMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['media'] });

  return {
    upload: useMutation({
      mutationFn: (vars: { file: File; alt?: string }) =>
        mediaApi.upload(vars.file, vars.alt),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateMediaPayload }) =>
        mediaApi.update(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => mediaApi.remove(id),
      onSuccess: invalidate,
    }),
    bulkRemove: useMutation({
      mutationFn: (ids: string[]) => mediaApi.bulkRemove(ids),
      onSuccess: invalidate,
    }),
  };
}
