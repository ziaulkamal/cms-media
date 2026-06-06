<!-- admin/src/pages/tags/Index.vue — daftar tag (terpisah dari Kategori): buat, edit, hapus + pagination >10. -->
<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { ApiError } from '@/api/http';
import BulkActionBar from '@/components/ui/BulkActionBar.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import Pagination from '@/components/ui/Pagination.vue';
import QueryState from '@/components/ui/QueryState.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useSelection } from '@/composables/useSelection';
import { useTagMutations, useTagsQuery } from '@/composables/useTags';
import { useToast } from '@/composables/useToast';
import type { Tag } from '@/types/cms';

const PER_PAGE = 10;

const toast = useToast();
const { confirm } = useConfirm();
const { data, isLoading, error } = useTagsQuery();
const { create, update, remove, bulkRemove } = useTagMutations();
const name = ref('');
const page = ref(1);

// Seleksi untuk hapus massal tag (pilih-semua mengikuti halaman aktif).
const sel = useSelection();
const pageIds = computed(() => pagedTags.value.map((t) => t.id));
function toggleAll(on: boolean): void {
  sel.setMany(pageIds.value, on);
}
async function onBulkDelete(): Promise<void> {
  const ok = await confirm({
    title: 'Hapus tag terpilih',
    message: `${sel.count.value} tag akan dihapus dan dilepas dari semua artikel.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await bulkRemove.mutateAsync(sel.ids.value);
    sel.clear();
    toast.success('Tag terpilih dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}

const editOpen = ref(false);
const editId = ref<string | null>(null);
const editName = ref('');
const editError = ref('');

const total = computed(() => data.value?.length ?? 0);
const totalPages = computed(() => Math.max(Math.ceil(total.value / PER_PAGE), 1));
const pagedTags = computed(() => {
  const start = (page.value - 1) * PER_PAGE;
  return (data.value ?? []).slice(start, start + PER_PAGE);
});

/** Buat tag baru lalu pindah ke halaman terakhir agar terlihat. */
async function onCreate(): Promise<void> {
  const value = name.value.trim();
  if (!value) return;
  try {
    await create.mutateAsync({ name: value });
    name.value = '';
    toast.success('Tag dibuat.');
    page.value = Math.ceil((total.value + 1) / PER_PAGE);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal membuat tag.');
  }
}

function openEdit(tag: Tag): void {
  editId.value = tag.id;
  editName.value = tag.name;
  editError.value = '';
  editOpen.value = true;
}

/** Simpan perubahan nama tag. */
async function onUpdate(): Promise<void> {
  editError.value = '';
  try {
    await update.mutateAsync({ id: editId.value!, payload: { name: editName.value } });
    editOpen.value = false;
    toast.success('Tag diperbarui.');
  } catch (e) {
    editError.value = e instanceof ApiError ? e.message : 'Gagal memperbarui tag.';
  }
}

/** Hapus tag dengan konfirmasi. */
async function onDelete(tag: Tag): Promise<void> {
  const ok = await confirm({
    title: 'Hapus tag',
    message: `Tag "${tag.name}" akan dihapus dan dilepas dari semua artikel.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await remove.mutateAsync(tag.id);
    toast.success('Tag dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus tag.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Tag" subtitle="Label artikel — terpisah dari Kategori." />

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card title="Tag Baru" class="lg:col-span-1">
        <form class="flex flex-col gap-3" @submit.prevent="onCreate">
          <TextInput v-model="name" label="Nama tag" placeholder="mis. Ekonomi" required />
          <Button type="submit" :loading="create.isPending.value">Tambah</Button>
        </form>
      </Card>

      <Card :title="`Daftar Tag (${total})`" class="lg:col-span-2">
        <QueryState
          :loading="isLoading"
          :error="error"
          :is-empty="total === 0"
          empty-text="Belum ada tag."
        >
          <label v-if="pagedTags.length" class="text-text-muted mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="accent-primary size-4 rounded"
              :checked="sel.allSelected(pageIds)"
              @change="toggleAll(($event.target as HTMLInputElement).checked)"
            />
            Pilih semua di halaman
          </label>

          <BulkActionBar :count="sel.count.value" :busy="bulkRemove.isPending.value" @delete="onBulkDelete" @clear="sel.clear" />

          <ul class="flex flex-wrap gap-2">
            <li
              v-for="tag in pagedTags"
              :key="tag.id"
              class="bg-bg-subtle text-text-primary group flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 text-sm"
              :class="sel.has(tag.id) ? 'ring-primary ring-2' : ''"
            >
              <input
                type="checkbox"
                class="accent-primary size-3.5 rounded"
                :checked="sel.has(tag.id)"
                @change="sel.toggle(tag.id)"
              />
              {{ tag.name }}
              <span class="text-text-subtle text-xs">/{{ tag.slug }}</span>
              <span class="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button type="button" class="text-text-subtle hover:text-primary p-0.5" aria-label="Edit tag" @click="openEdit(tag)">
                  <Pencil class="h-3.5 w-3.5" />
                </button>
                <button type="button" class="text-text-subtle hover:text-danger p-0.5" aria-label="Hapus tag" @click="onDelete(tag)">
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          </ul>

          <div v-if="total > PER_PAGE" class="mt-4">
            <Pagination
              :page="page"
              :per-page="PER_PAGE"
              :total="total"
              :total-pages="totalPages"
              @update:page="page = $event"
            />
          </div>
        </QueryState>
      </Card>
    </div>

    <Modal v-model:open="editOpen" title="Edit Tag">
      <TextInput v-model="editName" label="Nama tag" required :error="editError" />
      <template #footer>
        <Button variant="secondary" @click="editOpen = false">Batal</Button>
        <Button :loading="update.isPending.value" @click="onUpdate">Simpan</Button>
      </template>
    </Modal>
  </div>
</template>
