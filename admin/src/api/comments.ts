/** admin/src/api/comments.ts — endpoint moderasi komentar (editor ke atas). */
import type {
  CommentModeration,
  CommentModerationStats,
  ModerationQuery,
  SuccessEnvelope,
} from '@/types/cms';
import { http, unwrap, unwrapPaginated } from './http';

export const commentsApi = {
  /** Antrean moderasi (filter status & artikel). */
  moderationList: (query: ModerationQuery = {}) =>
    unwrapPaginated<CommentModeration>(
      http.get<SuccessEnvelope<CommentModeration[]>>('/comments/moderation', {
        params: query,
      }),
    ),

  /** Rekap jumlah komentar per status. */
  moderationStats: () =>
    unwrap<CommentModerationStats>(
      http.get<SuccessEnvelope<CommentModerationStats>>(
        '/comments/moderation/stats',
      ),
    ),

  approve: (id: string) =>
    unwrap<CommentModeration>(
      http.patch<SuccessEnvelope<CommentModeration>>(
        `/comments/${id}/approve`,
      ),
    ),

  spam: (id: string) =>
    unwrap<CommentModeration>(
      http.patch<SuccessEnvelope<CommentModeration>>(`/comments/${id}/spam`),
    ),

  remove: (id: string) => http.delete(`/comments/${id}`),

  bulkRemove: (ids: string[]) =>
    unwrap<{ deleted: number }>(
      http.post<SuccessEnvelope<{ deleted: number }>>('/comments/bulk-delete', { ids }),
    ),
};
