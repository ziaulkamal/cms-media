/** admin/src/api/gallery.ts — endpoint galeri foto & album (staf editorial). */
import type {
  CreateAlbumPayload,
  CreateGalleryPhotoPayload,
  GalleryAlbum,
  GalleryPhoto,
  Paginated,
  SuccessEnvelope,
  UpdateAlbumPayload,
  UpdateGalleryPhotoPayload,
} from '@/types/cms';
import { http, unwrap, unwrapPaginated } from './http';

export const galleryApi = {
  listManage: (page = 1, perPage = 24) =>
    unwrapPaginated<GalleryPhoto>(
      http.get<SuccessEnvelope<GalleryPhoto[]>>('/gallery/manage', {
        params: { page, perPage },
      }),
    ),

  createPhoto: (payload: CreateGalleryPhotoPayload) =>
    unwrap<GalleryPhoto>(
      http.post<SuccessEnvelope<GalleryPhoto>>('/gallery', payload),
    ),

  updatePhoto: (id: string, payload: UpdateGalleryPhotoPayload) =>
    unwrap<GalleryPhoto>(
      http.patch<SuccessEnvelope<GalleryPhoto>>(`/gallery/${id}`, payload),
    ),

  removePhoto: (id: string) => http.delete(`/gallery/${id}`),

  bulkRemovePhotos: (ids: string[]) =>
    unwrap<{ deleted: number }>(
      http.post<SuccessEnvelope<{ deleted: number }>>('/gallery/bulk-delete', { ids }),
    ),

  listAlbums: () =>
    unwrap<GalleryAlbum[]>(
      http.get<SuccessEnvelope<GalleryAlbum[]>>('/gallery/albums'),
    ),

  createAlbum: (payload: CreateAlbumPayload) =>
    unwrap<GalleryAlbum>(
      http.post<SuccessEnvelope<GalleryAlbum>>('/gallery/albums', payload),
    ),

  updateAlbum: (id: string, payload: UpdateAlbumPayload) =>
    unwrap<GalleryAlbum>(
      http.patch<SuccessEnvelope<GalleryAlbum>>(
        `/gallery/albums/${id}`,
        payload,
      ),
    ),

  removeAlbum: (id: string) => http.delete(`/gallery/albums/${id}`),
};

export type { Paginated };
