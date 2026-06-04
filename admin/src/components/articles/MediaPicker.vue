<!-- admin/src/components/articles/MediaPicker.vue — pilih featuredMediaId; unggah (dropzone) + popup metadata dari sini. -->
<script setup lang="ts">
import { ref } from 'vue';
import { ImageIcon, ImagePlus, Trash2 } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Dropzone from '@/components/ui/Dropzone.vue';
import Modal from '@/components/ui/Modal.vue';
import QueryState from '@/components/ui/QueryState.vue';
import { useMediaMeta } from '@/composables/useMediaMeta';
import { useMediaMutations, useMediaQuery } from '@/composables/useMedia';
import { useToast } from '@/composables/useToast';
import type { Media } from '@/types/cms';

const mediaId = defineModel<string | undefined>();
const props = defineProps<{ previewUrl?: string | null }>();

const toast = useToast();
const open = ref(false);
const page = ref(1);
const selectedUrl = ref<string | null>(props.previewUrl ?? null);
const { data, isLoading, error } = useMediaQuery(page, 12);
const { upload } = useMediaMutations();
const { editMedia } = useMediaMeta();

const uploading = ref(false);

/** Tetapkan media terpilih sebagai featured lalu tutup picker. */
function pick(media: Media): void {
  mediaId.value = media.id;
  selectedUrl.value = media.url;
  open.value = false;
}

/** Lepas pilihan featured media. */
function clear(): void {
  mediaId.value = undefined;
  selectedUrl.value = null;
}

/** Unggah dari dropzone (berkas pertama) → isi metadata (popup) → jadikan featured. */
async function onFiles(files: File[]): Promise<void> {
  uploading.value = true;
  try {
    const media = await upload.mutateAsync({ file: files[0] });
    const edited = await editMedia(media);
    pick(edited);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengunggah.');
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <Card title="Gambar Utama" :icon="ImageIcon">
    <div class="flex flex-col gap-3">
      <div
        v-if="selectedUrl"
        class="border-border group relative overflow-hidden rounded-lg border"
      >
        <img :src="selectedUrl" alt="Pratinjau gambar utama" class="h-40 w-full object-cover" />
        <div
          class="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
        >
          <Button size="sm" @click="open = true">
            <ImagePlus class="h-3.5 w-3.5" />
            Ganti
          </Button>
          <Button variant="danger" size="sm" @click="clear">
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <button
        v-else
        type="button"
        class="border-border-strong text-text-subtle hover:border-primary hover:text-primary hover:bg-primary-light/30 flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm transition-colors"
        @click="open = true"
      >
        <ImagePlus class="h-7 w-7" />
        <span>Pilih atau unggah gambar</span>
      </button>

      <Button v-if="selectedUrl" variant="secondary" size="sm" block @click="open = true">
        Pilih dari Pustaka
      </Button>
    </div>

    <Modal v-model:open="open" title="Pustaka Media">
      <div class="mb-4">
        <Dropzone :multiple="false" :busy="uploading" @files="onFiles" />
      </div>

      <QueryState
        :loading="isLoading"
        :error="error"
        :is-empty="!data || data.items.length === 0"
        empty-text="Pustaka kosong — unggah lewat dropzone di atas."
      >
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="m in data!.items"
            :key="m.id"
            type="button"
            class="border-border hover:border-primary overflow-hidden rounded-md border"
            :title="m.title ?? ''"
            @click="pick(m)"
          >
            <img :src="m.url" :alt="m.alt ?? ''" class="h-24 w-full object-cover" />
          </button>
        </div>
      </QueryState>
    </Modal>
  </Card>
</template>
