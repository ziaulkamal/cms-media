/** admin/src/composables/useTags.ts — server-state tag (list + create cepat). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { tagsApi } from '@/api/tags';
import type { CreateTagPayload } from '@/types/cms';

/** Daftar seluruh tag. */
export function useTagsQuery() {
  return useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() });
}

/** Mutasi tag; invalidate daftar pada sukses. */
export function useTagMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['tags'] });
  return {
    create: useMutation({
      mutationFn: (payload: CreateTagPayload) => tagsApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: CreateTagPayload }) =>
        tagsApi.update(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => tagsApi.remove(id),
      onSuccess: invalidate,
    }),
    bulkRemove: useMutation({
      mutationFn: (ids: string[]) => tagsApi.bulkRemove(ids),
      onSuccess: invalidate,
    }),
  };
}
