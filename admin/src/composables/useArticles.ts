/**
 * admin/src/composables/useArticles.ts
 * Server-state artikel via Vue Query: list, detail, dan mutasi workflow.
 */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { computed, type ComputedRef } from 'vue';
import { articlesApi } from '@/api/articles';
import { ApiError } from '@/api/http';
import type {
  ArticleQuery,
  CreateArticlePayload,
  PublishArticlePayload,
  UpdateArticlePayload,
} from '@/types/cms';

/** Daftar artikel manajemen (mempertahankan data lama saat refetch filter/halaman). */
export function useArticlesQuery(params: ComputedRef<ArticleQuery>) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => articlesApi.listManage(params.value),
    placeholderData: keepPreviousData,
  });
}

/**
 * Detail satu artikel untuk editor.
 * Catatan: backend belum punya GET /articles/manage/:id, jadi diambil dari
 * daftar manajemen lalu dicari per id (cukup untuk skala panel admin).
 */
export function useArticleDetail(id: ComputedRef<string | undefined>) {
  return useQuery({
    queryKey: ['article-detail', id],
    enabled: computed(() => !!id.value),
    queryFn: async () => {
      const res = await articlesApi.listManage({ perPage: 100 });
      const found = res.items.find((a) => a.id === id.value);
      if (!found) throw new ApiError('NOT_FOUND', 'Artikel tidak ditemukan.');
      return found;
    },
  });
}

/** Mutasi artikel; setiap sukses meng-invalidate cache daftar & detail. */
export function useArticleMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['articles'] });
    void qc.invalidateQueries({ queryKey: ['article-detail'] });
  };

  return {
    create: useMutation({
      mutationFn: (payload: CreateArticlePayload) => articlesApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateArticlePayload }) =>
        articlesApi.update(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    submit: useMutation({
      mutationFn: (id: string) => articlesApi.submit(id),
      onSuccess: invalidate,
    }),
    publish: useMutation({
      mutationFn: (vars: { id: string; payload?: PublishArticlePayload }) =>
        articlesApi.publish(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    archive: useMutation({
      mutationFn: (id: string) => articlesApi.archive(id),
      onSuccess: invalidate,
    }),
    draft: useMutation({
      mutationFn: (id: string) => articlesApi.draft(id),
      onSuccess: invalidate,
    }),
  };
}
