<!-- admin/src/pages/venue-content/Index.vue — pengayaan venue: deskripsi + foto per venue simpora2026. -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { MapPin, Pencil, Trash2 } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import { mediaApi } from '@/api/media';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Dropzone from '@/components/ui/Dropzone.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import Textarea from '@/components/ui/Textarea.vue';
import { useConfirm } from '@/composables/useConfirm';
import {
  useVenueContentMutations,
  useVenueContentQuery,
  useVenueSourcesQuery,
} from '@/composables/useVenueContent';
import { useToast } from '@/composables/useToast';
import type { VenueContent } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const { data, isLoading, error } = useVenueContentQuery();
const sources = useVenueSourcesQuery();
const m = useVenueContentMutations();

/** Opsi venue dari simpora2026 (toleran skema: id/slug/ref + name/title). */
const venueOptions = computed(() =>
  (sources.data.value?.venues ?? [])
    .map((v) => {
      const o = (v ?? {}) as Record<string, unknown>;
      const value = String(o.id ?? o.slug ?? o.ref ?? '');
      const label = String(o.name ?? o.title ?? value);
      return { value, label };
    })
    .filter((o) => o.value),
);
const hasSources = computed(
  () => sources.data.value?.available && venueOptions.value.length > 0,
);

// --- Form upsert ---
const formOpen = ref(false);
const isEdit = ref(false);
const uploading = ref(false);
const form = reactive({
  venueRef: '',
  description: '',
  imageMediaId: undefined as string | undefined,
  imageUrl: null as string | null,
});
const formError = ref('');

function openCreate(): void {
  isEdit.value = false;
  formError.value = '';
  Object.assign(form, { venueRef: '', description: '', imageMediaId: undefined, imageUrl: null });
  formOpen.value = true;
}

function openEdit(v: VenueContent): void {
  isEdit.value = true;
  formError.value = '';
  Object.assign(form, {
    venueRef: v.venueRef,
    description: v.description,
    imageMediaId: undefined,
    imageUrl: v.imageUrl,
  });
  formOpen.value = true;
}

/** Unggah gambar utama venue ke Media, simpan id + preview. */
async function onImage(files: File[]): Promise<void> {
  uploading.value = true;
  try {
    const media = await mediaApi.upload(files[0]);
    form.imageMediaId = media.id;
    form.imageUrl = media.url;
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengunggah gambar.');
  } finally {
    uploading.value = false;
  }
}

async function onSubmit(): Promise<void> {
  formError.value = '';
  if (!form.venueRef) {
    formError.value = 'Venue wajib dipilih/diisi.';
    return;
  }
  try {
    await m.upsert.mutateAsync({
      venueRef: form.venueRef,
      description: form.description,
      imageMediaId: form.imageMediaId,
    });
    formOpen.value = false;
    toast.success('Konten venue disimpan.');
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : 'Gagal menyimpan.';
  }
}

async function onRemove(v: VenueContent): Promise<void> {
  const ok = await confirm({
    title: 'Hapus konten venue',
    message: `Konten untuk "${v.venueRef}" akan dihapus.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await m.remove.mutateAsync(v.venueRef);
    toast.success('Konten venue dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Venue" subtitle="Deskripsi & foto pengayaan venue (data inti dari simpora2026).">
      <template #actions>
        <Button @click="openCreate">Tambah Konten</Button>
      </template>
    </PageHeader>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.length === 0"
      empty-text="Belum ada konten venue."
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <Card v-for="v in data!" :key="v.id">
          <div class="flex gap-4">
            <img
              v-if="v.imageUrl"
              :src="v.imageUrl"
              :alt="v.venueRef"
              class="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
            <span
              v-else
              class="bg-bg-subtle text-text-subtle flex h-20 w-20 shrink-0 items-center justify-center rounded-lg"
            >
              <MapPin class="h-6 w-6" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-text-primary truncate text-sm font-semibold">{{ v.venueRef }}</p>
              <p class="text-text-muted mt-1 line-clamp-3 text-sm">{{ v.description }}</p>
              <div class="mt-2 flex gap-2">
                <Button size="sm" variant="ghost" @click="openEdit(v)">
                  <Pencil class="h-4 w-4" /> Ubah
                </Button>
                <Button size="sm" variant="ghost" @click="onRemove(v)">
                  <Trash2 class="h-4 w-4" /> Hapus
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </QueryState>

    <!-- Form konten venue -->
    <Modal v-model:open="formOpen" :title="isEdit ? 'Ubah Konten Venue' : 'Tambah Konten Venue'">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <SelectInput
          v-if="hasSources && !isEdit"
          v-model="form.venueRef"
          label="Venue (dari simpora2026)"
          placeholder="Pilih venue"
          :options="venueOptions"
          :error="formError"
        />
        <TextInput
          v-else
          v-model="form.venueRef"
          label="Venue (id/slug)"
          :error="formError"
          :placeholder="isEdit ? '' : 'mis. stadion-calang'"
          required
        />

        <Textarea v-model="form.description" label="Deskripsi" :rows="6" />

        <div class="flex flex-col gap-2">
          <span class="text-text-primary text-sm font-medium">Gambar utama</span>
          <img
            v-if="form.imageUrl"
            :src="form.imageUrl"
            alt="Pratinjau"
            class="h-32 w-full rounded-lg object-cover"
          />
          <Dropzone :busy="uploading" :multiple="false" @files="onImage" />
        </div>
      </form>
      <template #footer>
        <Button variant="secondary" @click="formOpen = false">Batal</Button>
        <Button :loading="m.upsert.isPending.value" @click="onSubmit">Simpan</Button>
      </template>
    </Modal>
  </div>
</template>
