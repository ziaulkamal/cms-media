/** admin/src/api/comments.ts — endpoint moderasi komentar (editor ke atas). */
import type {
  CommentModeration,
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
};
