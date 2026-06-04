/** admin/src/api/media.ts — endpoint media (list, upload multipart, edit metadata, hapus). */
import type {
  Media,
  Paginated,
  SuccessEnvelope,
  UpdateMediaPayload,
} from '@/types/cms';
import { http, unwrap, unwrapPaginated } from './http';

export const mediaApi = {
  list: (page = 1, perPage = 24) =>
    unwrapPaginated<Media>(
      http.get<SuccessEnvelope<Media[]>>('/media', {
        params: { page, perPage },
      }),
    ),

  /** Unggah satu gambar (field "file") + alt opsional. */
  upload: (file: File, alt?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (alt) form.append('alt', alt);
    return unwrap<Media>(
      http.post<SuccessEnvelope<Media>>('/media', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  /** Ubah metadata media (judul/deskripsi/alt). */
  update: (id: string, payload: UpdateMediaPayload) =>
    unwrap<Media>(http.patch<SuccessEnvelope<Media>>(`/media/${id}`, payload)),

  remove: (id: string) => http.delete(`/media/${id}`),
};

export type { Media, Paginated };
