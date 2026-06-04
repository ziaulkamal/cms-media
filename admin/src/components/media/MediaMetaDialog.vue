<!-- admin/src/components/media/MediaMetaDialog.vue — dialog metadata media global (lihat useMediaMeta). -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { ApiError } from '@/api/http';
import Button from '@/components/ui/Button.vue';
import Modal from '@/components/ui/Modal.vue';
import TextInput from '@/components/ui/TextInput.vue';
import Textarea from '@/components/ui/Textarea.vue';
import { useMediaMutations } from '@/composables/useMedia';
import { useMediaMeta } from '@/composables/useMediaMeta';
import { useToast } from '@/composables/useToast';

const { state, respond } = useMediaMeta();
const { update } = useMediaMutations();
const toast = useToast();

const title = ref('');
const description = ref('');
const alt = ref('');

// Prefill saat media berubah (judul sudah auto-slug dari nama file di server).
watch(
  () => state.media,
  (m) => {
    title.value = m?.title ?? '';
    description.value = m?.description ?? '';
    alt.value = m?.alt ?? '';
  },
  { immediate: true },
);

/** Simpan metadata; kosong = pakai metadata otomatis dari server. */
async function onSave(): Promise<void> {
  if (!state.media) return;
  try {
    const updated = await update.mutateAsync({
      id: state.media.id,
      payload: {
        title: title.value || undefined,
        description: description.value || undefined,
        alt: alt.value || undefined,
      },
    });
    toast.success('Metadata gambar disimpan.');
    respond(updated);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan metadata.');
  }
}

/** Lewati pengisian; pakai metadata otomatis apa adanya. */
function onSkip(): void {
  if (state.media) respond(state.media);
}
</script>

<template>
  <Modal
    :open="state.open"
    title="Detail Gambar"
    description="Lengkapi metadata untuk SEO & aksesibilitas. Boleh dikosongkan."
    @update:open="(v) => !v && onSkip()"
  >
    <div class="flex flex-col gap-5">
      <figure
        v-if="state.media"
        class="border-border ring-border/60 overflow-hidden rounded-lg border ring-1"
      >
        <div
          class="checkerboard flex items-center justify-center p-3"
          style="min-height: 9rem"
        >
          <img
            :src="state.media.url"
            :alt="alt"
            class="max-h-52 max-w-full rounded object-contain shadow-sm"
          />
        </div>
        <figcaption
          class="border-border text-text-subtle truncate border-t bg-surface px-3 py-2 text-xs"
        >
          {{ state.media.title || 'Tanpa judul' }}
        </figcaption>
      </figure>

      <div class="flex flex-col gap-4">
        <TextInput
          v-model="title"
          label="Judul gambar"
          placeholder="Otomatis dari nama file bila dikosongkan"
        />
        <TextInput
          v-model="alt"
          label="Alt (teks alternatif — disarankan untuk SEO)"
          placeholder="Deskripsi singkat isi gambar"
        />
        <Textarea
          v-model="description"
          label="Deskripsi (SEO)"
          :rows="3"
          placeholder="Keterangan gambar untuk SEO/aksesibilitas"
        />
      </div>
    </div>
    <template #footer>
      <Button variant="secondary" @click="onSkip">Lewati</Button>
      <Button :loading="update.isPending.value" @click="onSave">Simpan</Button>
    </template>
  </Modal>
</template>
