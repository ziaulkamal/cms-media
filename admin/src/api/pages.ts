/** admin/src/api/pages.ts — endpoint halaman statis (kelola + detail). */
import type {
  CreatePagePayload,
  Page,
  PageQuery,
  SuccessEnvelope,
  UpdatePagePayload,
} from '@/types/cms';
import { http, unwrap, unwrapPaginated } from './http';

export const pagesApi = {
  list: (query: PageQuery = {}) =>
    unwrapPaginated<Page>(
      http.get<SuccessEnvelope<Page[]>>('/pages', { params: query }),
    ),

  get: (id: string) =>
    unwrap<Page>(http.get<SuccessEnvelope<Page>>(`/pages/manage/${id}`)),

  create: (payload: CreatePagePayload) =>
    unwrap<Page>(http.post<SuccessEnvelope<Page>>('/pages', payload)),

  update: (id: string, payload: UpdatePagePayload) =>
    unwrap<Page>(http.patch<SuccessEnvelope<Page>>(`/pages/${id}`, payload)),

  remove: (id: string) =>
    unwrap<{ id: string }>(
      http.delete<SuccessEnvelope<{ id: string }>>(`/pages/${id}`),
    ),
};
