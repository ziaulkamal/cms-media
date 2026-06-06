<!-- admin/src/pages/media/Index.vue — pustaka media: dropzone upload + popup metadata (SEO) + hapus. -->
<script setup lang="ts">
import { Images, Pencil, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { ApiError } from '@/api/http';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Dropzone from '@/components/ui/Dropzone.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectableTile from '@/components/ui/SelectableTile.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useMediaMeta } from '@/composables/useMediaMeta';
import { useMediaMutations, useMediaQuery } from '@/composables/useMedia';
import { useSelection } from '@/composables/useSelection';
import { useToast } from '@/composables/useToast';
import { formatBytes } from '@/lib/format';

const toast = useToast();
const { confirm } = useConfirm();
const { editMedia } = useMediaMeta();
const page = ref(1);
const { data, isLoading, error } = useMediaQuery(page, 24);
const { upload, remove, bulkRemove } = useMediaMutations();

const uploading = ref(false);

// Seleksi untuk hapus massal media.
const sel = useSelection();
const pageIds = computed(() => (data.value?.items ?? []).map((x) => x.id));
function toggleAll(on: boolean): void {
  sel.setMany(pageIds.value, on);
}
async function onBulkDelete(): Promise<void> {
  const ok = await confirm({
    title: 'Hapus media terpilih',
    message: `${sel.count.value} media akan dihapus permanen beserta berkasnya.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await bulkRemove.mutateAsync(sel.ids.value);
    sel.clear();
    toast.success('Media terpilih dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}

/** Unggah berkas (dropzone) sekuensial; tiap gambar langsung minta isi metadata. */
async function onFiles(files: File[]): Promise<void> {
  uploading.value = true;
  for (const file of files) {
    try {
      const media = await upload.mutateAsync({ file });
      await editMedia(media);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : `Gagal unggah ${file.name}.`);
    }
  }
  uploading.value = false;
}

/** Hapus media setelah konfirmasi. */
async function onRemove(id: string): Promise<void> {
  const ok = await confirm({
    title: 'Hapus media',
    message: 'Media ini akan dihapus permanen dan tak bisa dikembalikan.',
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await remove.mutateAsync(id);
    toast.success('Media dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Media" subtitle="Pustaka gambar — unggah lalu lengkapi metadata SEO." />

    <Card class="mb-5">
      <Dropzone :busy="uploading" @files="onFiles" />
    </Card>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.items.length === 0"
      empty-text="Belum ada media. Unggah lewat dropzone di atas."
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
            <Images class="h-4 w-4" /> {{ data!.meta.total }} media
          </span>
        </label>
        <div v-if="sel.count.value" class="flex items-center gap-2">
          <span class="text-text-primary text-sm font-medium">{{ sel.count.value }} dipilih</span>
          <Button size="sm" variant="ghost" @click="sel.clear">Batal</Button>
          <Button size="sm" variant="danger" :loading="bulkRemove.isPending.value" @click="onBulkDelete">
            <Trash2 class="h-4 w-4" /> Hapus
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <SelectableTile
          v-for="m in data!.items"
          :key="m.id"
          :src="m.url"
          :alt="m.alt ?? ''"
          :selected="sel.has(m.id)"
          @toggle="sel.toggle(m.id)"
        >
          <template #actions>
            <button
              type="button"
              aria-label="Ubah metadata"
              class="bg-surface/90 text-text-muted hover:text-primary flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur"
              @click="editMedia(m)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Hapus media"
              class="bg-surface/90 text-text-muted hover:text-danger flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur"
              @click="onRemove(m.id)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </template>
          <template #footer>
            <p class="text-text-primary truncate text-xs font-medium">{{ m.title || 'tanpa-judul' }}</p>
            <p class="text-text-subtle text-xs">
              {{ formatBytes(m.size) }}<span v-if="m.width"> · {{ m.width }}×{{ m.height }}</span>
            </p>
          </template>
        </SelectableTile>
      </div>

      <div class="mt-4">
        <Pagination
          :page="data!.meta.page"
          :per-page="data!.meta.perPage"
          :total="data!.meta.total"
          :total-pages="data!.meta.totalPages"
          @update:page="page = $event"
        />
      </div>
    </QueryState>
  </div>
</template>
