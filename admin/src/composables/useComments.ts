/** admin/src/composables/useComments.ts — server-state moderasi komentar. */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { type ComputedRef } from 'vue';
import { commentsApi } from '@/api/comments';
import type { ModerationQuery } from '@/types/cms';

/** Antrean moderasi (filter reaktif). */
export function useCommentsQuery(params: ComputedRef<ModerationQuery>) {
  return useQuery({
    queryKey: ['comments', params],
    queryFn: () => commentsApi.moderationList(params.value),
    placeholderData: keepPreviousData,
  });
}

/** Rekap jumlah komentar per status (untuk header moderasi). */
export function useCommentStatsQuery() {
  return useQuery({
    queryKey: ['comments', 'stats'],
    queryFn: () => commentsApi.moderationStats(),
  });
}

/** Mutasi moderasi; invalidate antrean pada sukses. */
export function useCommentMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['comments'] });

  return {
    approve: useMutation({
      mutationFn: (id: string) => commentsApi.approve(id),
      onSuccess: invalidate,
    }),
    spam: useMutation({
      mutationFn: (id: string) => commentsApi.spam(id),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => commentsApi.remove(id),
      onSuccess: invalidate,
    }),
    bulkRemove: useMutation({
      mutationFn: (ids: string[]) => commentsApi.bulkRemove(ids),
      onSuccess: invalidate,
    }),
  };
}
