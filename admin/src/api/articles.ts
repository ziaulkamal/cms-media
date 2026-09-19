/** admin/src/api/articles.ts — endpoint artikel (manajemen + workflow). */
import type {
  Article,
  ArticleQuery,
  CreateArticlePayload,
  Paginated,
  PublishArticlePayload,
  SuccessEnvelope,
  UpdateArticlePayload,
} from '@/types/cms';
import { http, unwrap, unwrapPaginated } from './http';

export const articlesApi = {
  /** Daftar artikel untuk staf (editor: semua, penulis: miliknya). */
  listManage: (query: ArticleQuery = {}) =>
    unwrapPaginated<Article>(
      http.get<SuccessEnvelope<Article[]>>('/articles/manage', {
        params: query,
      }),
    ),

  create: (payload: CreateArticlePayload) =>
    unwrap<Article>(
      http.post<SuccessEnvelope<Article>>('/articles', payload),
    ),

  update: (id: string, payload: UpdateArticlePayload) =>
    unwrap<Article>(
      http.patch<SuccessEnvelope<Article>>(`/articles/${id}`, payload),
    ),

  submit: (id: string) =>
    unwrap<Article>(
      http.post<SuccessEnvelope<Article>>(`/articles/${id}/submit`),
    ),

  publish: (id: string, payload: PublishArticlePayload = {}) =>
    unwrap<Article>(
      http.post<SuccessEnvelope<Article>>(`/articles/${id}/publish`, payload),
    ),

  archive: (id: string) =>
    unwrap<Article>(
      http.post<SuccessEnvelope<Article>>(`/articles/${id}/archive`),
    ),

  draft: (id: string) =>
    unwrap<Article>(
      http.post<SuccessEnvelope<Article>>(`/articles/${id}/draft`),
    ),

  /** Hapus permanen (tag, revisi & komentar ikut terhapus; media tetap). */
  remove: (id: string) =>
    unwrap<{ deleted: number }>(
      http.delete<SuccessEnvelope<{ deleted: number }>>(`/articles/${id}`),
    ),

  bulkRemove: (ids: string[]) =>
    unwrap<{ deleted: number }>(
      http.post<SuccessEnvelope<{ deleted: number }>>('/articles/bulk-delete', { ids }),
    ),
};

export type { Article, Paginated };
