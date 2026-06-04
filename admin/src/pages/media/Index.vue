<!-- admin/src/pages/media/Index.vue — pustaka media: dropzone upload + popup metadata (SEO) + hapus. -->
<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { ApiError } from '@/api/http';
import Card from '@/components/ui/Card.vue';
import Dropzone from '@/components/ui/Dropzone.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useMediaMeta } from '@/composables/useMediaMeta';
import { useMediaMutations, useMediaQuery } from '@/composables/useMedia';
import { useToast } from '@/composables/useToast';
import { formatBytes } from '@/lib/format';

const toast = useToast();
const { confirm } = useConfirm();
const { editMedia } = useMediaMeta();
const page = ref(1);
const { data, isLoading, error } = useMediaQuery(page, 24);
const { upload, remove } = useMediaMutations();

const uploading = ref(false);

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
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <div
          v-for="m in data!.items"
          :key="m.id"
          class="border-border group bg-surface overflow-hidden rounded-lg border"
        >
          <div class="relative">
            <img :src="m.url" :alt="m.alt ?? ''" class="aspect-square w-full object-cover" />
            <button
              type="button"
              class="bg-danger absolute right-1.5 top-1.5 rounded-md p-1.5 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Hapus media"
              @click="onRemove(m.id)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
          <div class="px-2 py-1.5">
            <p class="text-text-primary truncate text-xs font-medium">{{ m.title || 'tanpa-judul' }}</p>
            <p class="text-text-subtle text-xs">
              {{ formatBytes(m.size) }}<span v-if="m.width"> · {{ m.width }}×{{ m.height }}</span>
            </p>
          </div>
        </div>
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
