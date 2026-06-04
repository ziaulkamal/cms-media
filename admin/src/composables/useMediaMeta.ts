/**
 * admin/src/composables/useMediaMeta.ts
 * Dialog metadata media imperatif berbasis Promise (judul/deskripsi/alt untuk SEO).
 * Pakai: `const updated = await editMedia(media)`. Render via <MediaMetaDialog/>.
 */
import { reactive } from 'vue';
import type { Media } from '@/types/cms';

interface MediaMetaState {
  open: boolean;
  media: Media | null;
  resolve: ((media: Media) => void) | null;
}

const state = reactive<MediaMetaState>({ open: false, media: null, resolve: null });

export function useMediaMeta() {
  /** Buka dialog metadata untuk `media`; resolve dengan media terbaru (disimpan/dilewati). */
  function editMedia(media: Media): Promise<Media> {
    return new Promise((resolve) => {
      state.media = media;
      state.open = true;
      state.resolve = resolve;
    });
  }

  /** Tutup dialog & teruskan hasil ke pemanggil. */
  function respond(media: Media): void {
    state.open = false;
    const resolve = state.resolve;
    state.resolve = null;
    resolve?.(media);
  }

  return { state, editMedia, respond };
}
