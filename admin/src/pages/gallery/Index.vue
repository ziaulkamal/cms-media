<!-- admin/src/pages/gallery/Index.vue — galeri: unggah foto, atur caption/kategori/orientasi, kelola album. -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ApiError } from '@/api/http';
import { mediaApi } from '@/api/media';
import { Images, Pencil, Trash2 } from 'lucide-vue-next';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Dropzone from '@/components/ui/Dropzone.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import Pagination from '@/components/ui/Pagination.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectableTile from '@/components/ui/SelectableTile.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import {
  useAlbumsQuery,
  useGalleryMutations,
  useGalleryQuery,
} from '@/composables/useGallery';
import { usePagination } from '@/composables/usePagination';
import { useSelection } from '@/composables/useSelection';
import { useToast } from '@/composables/useToast';
import { photoOrientationLabel, toOptions } from '@/lib/labels';
import type { GalleryPhoto, PhotoOrientation } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const { page } = usePagination(24);
const { data, isLoading, error } = useGalleryQuery(page, 24);
const { data: albums } = useAlbumsQuery();
const m = useGalleryMutations();

// Seleksi untuk hapus massal foto.
const sel = useSelection();
const pageIds = computed(() => (data.value?.items ?? []).map((p) => p.id));
function toggleAll(on: boolean): void {
  sel.setMany(pageIds.value, on);
}
async function onBulkDelete(): Promise<void> {
  const ok = await confirm({
    title: 'Hapus foto terpilih',
    message: `${sel.count.value} foto akan dihapus dari galeri (berkas media tetap ada).`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await m.bulkRemovePhotos.mutateAsync(sel.ids.value);
    sel.clear();
    toast.success('Foto terpilih dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}

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
      <!-- Toolbar: pilih-semua + jumlah, aksi massal muncul saat ada seleksi -->
      <div class="border-border bg-surface mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5">
        <label class="text-text-muted flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="accent-primary size-4 rounded"
            :checked="sel.allSelected(pageIds)"
            @change="toggleAll(($event.target as HTMLInputElement).checked)"
          />
          <span class="inline-flex items-center gap-1.5">
            <Images class="h-4 w-4" /> {{ data!.meta.total }} foto
          </span>
        </label>
        <div v-if="sel.count.value" class="flex items-center gap-2">
          <span class="text-text-primary text-sm font-medium">{{ sel.count.value }} dipilih</span>
          <Button size="sm" variant="ghost" @click="sel.clear">Batal</Button>
          <Button size="sm" variant="danger" :loading="m.bulkRemovePhotos.isPending.value" @click="onBulkDelete">
            <Trash2 class="h-4 w-4" /> Hapus
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <SelectableTile
          v-for="photo in data!.items"
          :key="photo.id"
          :src="photo.src"
          :alt="photo.caption ?? 'Foto galeri'"
          :selected="sel.has(photo.id)"
          @toggle="sel.toggle(photo.id)"
        >
          <template #actions>
            <button
              type="button"
              aria-label="Ubah foto"
              class="bg-surface/90 text-text-muted hover:text-primary flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur"
              @click="openEdit(photo)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Hapus foto"
              class="bg-surface/90 text-text-muted hover:text-danger flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur"
              @click="onRemove(photo)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </template>
          <template #footer>
            <p class="text-text-primary truncate text-sm font-medium">
              {{ photo.caption || 'Tanpa keterangan' }}
            </p>
            <div class="mt-1.5 flex flex-wrap items-center gap-1">
              <Badge variant="info">{{ photoOrientationLabel[photo.orientation] }}</Badge>
              <Badge v-if="photo.category" variant="neutral">{{ photo.category }}</Badge>
              <Badge v-if="!photo.isPublished" variant="warning">Tersembunyi</Badge>
            </div>
          </template>
        </SelectableTile>
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
