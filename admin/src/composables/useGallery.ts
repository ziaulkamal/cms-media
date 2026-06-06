/** admin/src/composables/useGallery.ts — server-state galeri foto & album. */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { galleryApi } from '@/api/gallery';
import type {
  CreateAlbumPayload,
  CreateGalleryPhotoPayload,
  UpdateAlbumPayload,
  UpdateGalleryPhotoPayload,
} from '@/types/cms';

/** Daftar foto galeri ber-paginasi (admin). */
export function useGalleryQuery(page: MaybeRefOrGetter<number>, perPage = 24) {
  const pageRef = computed(() => toValue(page));
  return useQuery({
    queryKey: ['gallery', pageRef, perPage],
    queryFn: () => galleryApi.listManage(pageRef.value, perPage),
    placeholderData: keepPreviousData,
  });
}

/** Daftar album galeri. */
export function useAlbumsQuery() {
  return useQuery({
    queryKey: ['gallery-albums'],
    queryFn: () => galleryApi.listAlbums(),
  });
}

/** Mutasi foto & album; invalidate cache terkait pada sukses. */
export function useGalleryMutations() {
  const qc = useQueryClient();
  const invalidatePhotos = () =>
    void qc.invalidateQueries({ queryKey: ['gallery'] });
  const invalidateAlbums = () =>
    void qc.invalidateQueries({ queryKey: ['gallery-albums'] });

  return {
    createPhoto: useMutation({
      mutationFn: (payload: CreateGalleryPhotoPayload) =>
        galleryApi.createPhoto(payload),
      onSuccess: invalidatePhotos,
    }),
    updatePhoto: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateGalleryPhotoPayload }) =>
        galleryApi.updatePhoto(vars.id, vars.payload),
      onSuccess: invalidatePhotos,
    }),
    removePhoto: useMutation({
      mutationFn: (id: string) => galleryApi.removePhoto(id),
      onSuccess: invalidatePhotos,
    }),
    createAlbum: useMutation({
      mutationFn: (payload: CreateAlbumPayload) => galleryApi.createAlbum(payload),
      onSuccess: invalidateAlbums,
    }),
    updateAlbum: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateAlbumPayload }) =>
        galleryApi.updateAlbum(vars.id, vars.payload),
      onSuccess: invalidateAlbums,
    }),
    removeAlbum: useMutation({
      mutationFn: (id: string) => galleryApi.removeAlbum(id),
      onSuccess: () => {
        invalidateAlbums();
        invalidatePhotos();
      },
    }),
  };
}
