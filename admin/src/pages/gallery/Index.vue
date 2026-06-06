<!-- admin/src/pages/gallery/Index.vue — galeri: unggah foto, atur caption/kategori/orientasi, kelola album. -->
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Pencil, Trash2 } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import { mediaApi } from '@/api/media';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Dropzone from '@/components/ui/Dropzone.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import Pagination from '@/components/ui/Pagination.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import {
  useAlbumsQuery,
  useGalleryMutations,
  useGalleryQuery,
} from '@/composables/useGallery';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import { photoOrientationLabel, toOptions } from '@/lib/labels';
import type { GalleryPhoto, PhotoOrientation } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const { page } = usePagination(24);
const { data, isLoading, error } = useGalleryQuery(page, 24);
const { data: albums } = useAlbumsQuery();
const m = useGalleryMutations();

const orientationOptions = toOptions(photoOrientationLabel);
const albumOptions = () =>
  (albums.value ?? []).map((a) => ({ value: a.id, label: a.title }));

const uploading = ref(false);

/** Unggah berkas ke Media lalu daftarkan sebagai foto galeri. */
async function onFiles(files: File[]): Promise<void> {
  uploading.value = true;
  try {
    for (const file of files) {
      const media = await mediaApi.upload(file);
      await m.createPhoto.mutateAsync({ mediaId: media.id });
    }
    toast.success(`${files.length} foto diunggah.`);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengunggah foto.');
  } finally {
    uploading.value = false;
  }
}

// --- Edit foto ---
const editOpen = ref(false);
const editId = ref<string | null>(null);
const form = reactive({
  caption: '',
  category: '',
  orientation: 'LANSKAP' as PhotoOrientation,
  albumId: '',
  sortOrder: '0',
  isPublished: true,
});

function openEdit(photo: GalleryPhoto): void {
  editId.value = photo.id;
  form.caption = photo.caption ?? '';
  form.category = photo.category ?? '';
  form.orientation = photo.orientation;
  form.albumId = photo.albumId ?? '';
  form.sortOrder = String(photo.sortOrder);
  form.isPublished = photo.isPublished;
  editOpen.value = true;
}

async function onSave(): Promise<void> {
  if (!editId.value) return;
  try {
    await m.updatePhoto.mutateAsync({
      id: editId.value,
      payload: {
        caption: form.caption || undefined,
        category: form.category || undefined,
        orientation: form.orientation,
        albumId: form.albumId || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isPublished: form.isPublished,
      },
    });
    editOpen.value = false;
    toast.success('Foto diperbarui.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan.');
  }
}

async function onRemove(photo: GalleryPhoto): Promise<void> {
  const ok = await confirm({
    title: 'Hapus foto',
    message: 'Foto akan dihapus dari galeri (berkas media tetap ada).',
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await m.removePhoto.mutateAsync(photo.id);
    toast.success('Foto dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}

// --- Kelola album ---
const albumOpen = ref(false);
const newAlbumTitle = ref('');

async function onCreateAlbum(): Promise<void> {
  if (newAlbumTitle.value.trim().length < 2) return;
  try {
    await m.createAlbum.mutateAsync({ title: newAlbumTitle.value.trim() });
    newAlbumTitle.value = '';
    toast.success('Album dibuat.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal membuat album.');
  }
}

async function onRemoveAlbum(id: string): Promise<void> {
  const ok = await confirm({
    title: 'Hapus album',
    message: 'Album dihapus; foto di dalamnya tidak terhapus (lepas dari album).',
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await m.removeAlbum.mutateAsync(id);
    toast.success('Album dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus album.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Galeri" subtitle="Kelola foto galeri & album.">
      <template #actions>
        <Button variant="secondary" @click="albumOpen = true">Kelola Album</Button>
      </template>
    </PageHeader>

    <Card class="mb-5">
      <Dropzone :busy="uploading" multiple @files="onFiles" />
    </Card>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.items.length === 0"
      empty-text="Belum ada foto. Unggah yang pertama."
    >
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <figure
          v-for="photo in data!.items"
          :key="photo.id"
          class="group border-border bg-surface relative overflow-hidden rounded-xl border"
        >
          <img
            :src="photo.src"
            :alt="photo.caption ?? 'Foto galeri'"
            loading="lazy"
            class="aspect-square w-full object-cover"
          />
          <figcaption class="flex items-start justify-between gap-2 p-3">
            <div class="min-w-0">
              <p class="text-text-primary truncate text-sm">
                {{ photo.caption || 'Tanpa keterangan' }}
              </p>
              <div class="mt-1 flex flex-wrap items-center gap-1">
                <Badge variant="info">{{ photoOrientationLabel[photo.orientation] }}</Badge>
                <Badge v-if="photo.category" variant="neutral">{{ photo.category }}</Badge>
                <Badge v-if="!photo.isPublished" variant="warning">Tersembunyi</Badge>
              </div>
            </div>
          </figcaption>
          <div
            class="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <button
              type="button"
              aria-label="Ubah foto"
              class="bg-surface/90 text-text-muted hover:text-primary flex h-8 w-8 items-center justify-center rounded-md shadow-sm"
              @click="openEdit(photo)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Hapus foto"
              class="bg-surface/90 text-text-muted hover:text-danger flex h-8 w-8 items-center justify-center rounded-md shadow-sm"
              @click="onRemove(photo)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </figure>
      </div>

      <div class="mt-5">
        <Pagination
          :page="data!.meta.page"
          :per-page="data!.meta.perPage"
          :total="data!.meta.total"
          :total-pages="data!.meta.totalPages"
          @update:page="page = $event"
        />
      </div>
    </QueryState>

    <!-- Modal edit foto -->
    <Modal v-model:open="editOpen" title="Ubah Foto">
      <form class="flex flex-col gap-4" @submit.prevent="onSave">
        <TextInput v-model="form.caption" label="Keterangan" />
        <TextInput v-model="form.category" label="Kategori" placeholder="mis. Pembukaan" />
        <SelectInput
          v-model="form.orientation"
          label="Orientasi"
          :allow-empty="false"
          :options="orientationOptions"
        />
        <SelectInput
          v-model="form.albumId"
          label="Album"
          placeholder="Tanpa album"
          :options="albumOptions()"
        />
        <TextInput v-model="form.sortOrder" label="Urutan" type="number" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.isPublished" type="checkbox" class="accent-primary" />
          Tampilkan di galeri publik
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="editOpen = false">Batal</Button>
        <Button :loading="m.updatePhoto.isPending.value" @click="onSave">Simpan</Button>
      </template>
    </Modal>

    <!-- Modal kelola album -->
    <Modal v-model:open="albumOpen" title="Kelola Album">
      <div class="flex flex-col gap-4">
        <form class="flex items-end gap-2" @submit.prevent="onCreateAlbum">
          <div class="flex-1">
            <TextInput v-model="newAlbumTitle" label="Album baru" placeholder="Judul album" />
          </div>
          <Button :loading="m.createAlbum.isPending.value" @click="onCreateAlbum">Tambah</Button>
        </form>

        <ul class="flex flex-col gap-2">
          <li
            v-for="album in albums ?? []"
            :key="album.id"
            class="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <span class="text-text-primary text-sm">
              {{ album.title }}
              <span class="text-text-subtle">· {{ album.photoCount }} foto</span>
            </span>
            <button
              type="button"
              class="text-text-subtle hover:text-danger"
              aria-label="Hapus album"
              @click="onRemoveAlbum(album.id)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </li>
          <li v-if="!albums || albums.length === 0" class="text-text-subtle py-2 text-center text-sm">
            Belum ada album.
          </li>
        </ul>
      </div>
    </Modal>
  </div>
</template>
