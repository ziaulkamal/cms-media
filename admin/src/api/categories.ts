/** admin/src/api/categories.ts — endpoint kategori (list + CRUD editor). */
import type {
  Category,
  CreateCategoryPayload,
  ReorderCategoryItem,
  SuccessEnvelope,
  UpdateCategoryPayload,
} from '@/types/cms';
import { http, unwrap } from './http';

export const categoriesApi = {
  list: () =>
    unwrap<Category[]>(http.get<SuccessEnvelope<Category[]>>('/categories')),

  create: (payload: CreateCategoryPayload) =>
    unwrap<Category>(
      http.post<SuccessEnvelope<Category>>('/categories', payload),
    ),

  update: (id: string, payload: UpdateCategoryPayload) =>
    unwrap<Category>(
      http.patch<SuccessEnvelope<Category>>(`/categories/${id}`, payload),
    ),

  remove: (id: string) =>
    unwrap<{ id: string }>(
      http.delete<SuccessEnvelope<{ id: string }>>(`/categories/${id}`),
    ),

  bulkRemove: (ids: string[]) =>
    unwrap<{ deleted: number }>(
      http.post<SuccessEnvelope<{ deleted: number }>>('/categories/bulk-delete', { ids }),
    ),

  reorder: (items: ReorderCategoryItem[]) =>
    unwrap<{ updated: number }>(
      http.patch<SuccessEnvelope<{ updated: number }>>('/categories/reorder', { items }),
    ),
};
