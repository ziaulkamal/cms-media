/** admin/src/api/tags.ts — endpoint tag (list + create cepat). */
import type { CreateTagPayload, SuccessEnvelope, Tag } from '@/types/cms';
import { http, unwrap } from './http';

export const tagsApi = {
  list: () => unwrap<Tag[]>(http.get<SuccessEnvelope<Tag[]>>('/tags')),

  create: (payload: CreateTagPayload) =>
    unwrap<Tag>(http.post<SuccessEnvelope<Tag>>('/tags', payload)),

  update: (id: string, payload: CreateTagPayload) =>
    unwrap<Tag>(http.patch<SuccessEnvelope<Tag>>(`/tags/${id}`, payload)),

  remove: (id: string) =>
    unwrap<{ id: string }>(
      http.delete<SuccessEnvelope<{ id: string }>>(`/tags/${id}`),
    ),
};
