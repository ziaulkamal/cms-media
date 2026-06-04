<!-- admin/src/pages/pages/Index.vue — daftar halaman statis: filter status, tabel, aksi + aksi massal. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { FileText, PencilLine, Plus, Rocket, Trash2, X } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import DataTable, { type Column } from '@/components/ui/DataTable.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import RowActionsMenu, { type RowAction } from '@/components/ui/RowActionsMenu.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { usePageMutations, usePagesQuery } from '@/composables/usePages';
import { useQueryParam } from '@/composables/useFilters';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import { formatDate } from '@/lib/format';
import { pageStatusLabel, pageStatusVariant, toOptions } from '@/lib/labels';
import type { Page, PageQuery } from '@/types/cms';

const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const status = useQueryParam('status');
const { page, perPage } = usePagination(20);

const params = computed<PageQuery>(() => ({
  page: page.value,
  perPage: perPage.value,
  status: (status.value || undefined) as PageQuery['status'],
}));

const { data, isLoading, error } = usePagesQuery(params);
const { update, remove } = usePageMutations();
const statusOptions = toOptions(pageStatusLabel);

const columns: Column[] = [
  { key: 'select', label: '', class: 'w-10' },
  { key: 'title', label: 'Judul' },
  { key: 'slug', label: 'Slug', class: 'hidden md:table-cell' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Diperbarui', class: 'hidden lg:table-cell' },
  { key: 'actions', label: 'Aksi', align: 'right' },
];

/** Hapus halaman (non-wajib) dengan konfirmasi + toast. */
async function onRemove(p: Page): Promise<void> {
  if (p.isMandatory) {
    toast.warning('Halaman wajib tidak bisa dihapus.');
    return;
  }
  const ok = await confirm({
    title: 'Hapus halaman',
    message: `Halaman "${p.title}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await remove.mutateAsync(p.id);
    toast.success('Halaman dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}

/** Aksi per-baris (kebab). */
function rowActions(p: Page): RowAction[] {
  const items: RowAction[] = [
    { label: 'Edit halaman', icon: PencilLine, onClick: () => router.push(`/pages/${p.id}/edit`) },
  ];
  if (!p.isMandatory) {
    items.push({ label: 'Hapus', icon: Trash2, danger: true, onClick: () => onRemove(p) });
  }
  return items;
}

// ── Seleksi & aksi massal ────────────────────────────────────────────────
const items = computed(() => data.value?.items ?? []);
const selectedIds = ref<Set<string>>(new Set());
const selectedCount = computed(() => selectedIds.value.size);
const allSelected = computed(
  () => items.value.length > 0 && items.value.every((p) => selectedIds.value.has(p.id)),
);
const someSelected = computed(() => selectedCount.value > 0 && !allSelected.value);
const bulkBusy = ref(false);

function isSelected(id: string): boolean {
  return selectedIds.value.has(id);
}
function toggleRow(id: string): void {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}
function toggleAll(): void {
  selectedIds.value = allSelected.value
    ? new Set()
    : new Set(items.value.map((p) => p.id));
}
function clearSelection(): void {
  selectedIds.value = new Set();
}

// Bersihkan seleksi saat filter/halaman berubah.
watch(params, clearSelection);

/** Jalankan mutasi untuk tiap id; ringkas hasil sukses/gagal. */
async function runBulk(
  ids: string[],
  fn: (id: string) => Promise<unknown>,
  okLabel: string,
): Promise<void> {
  if (!ids.length) return;
  bulkBusy.value = true;
  try {
    const results = await Promise.allSettled(ids.map((id) => fn(id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    if (fail === 0) toast.success(`${ok} halaman ${okLabel}.`);
    else if (ok === 0) toast.error(`Gagal memproses ${fail} halaman.`);
    else toast.info(`${ok} ${okLabel}, ${fail} gagal.`);
    clearSelection();
  } finally {
    bulkBusy.value = false;
  }
}

async function bulkPublish(): Promise<void> {
  if (await confirm({ title: 'Terbitkan massal', message: `Terbitkan ${selectedCount.value} halaman terpilih?`, confirmText: 'Terbitkan' }))
    await runBulk([...selectedIds.value], (id) => update.mutateAsync({ id, payload: { status: 'PUBLISHED' } }), 'diterbitkan');
}
async function bulkDraft(): Promise<void> {
  if (await confirm({ title: 'Jadikan draf', message: `Ubah ${selectedCount.value} halaman terpilih menjadi draf?`, confirmText: 'Jadikan Draf' }))
    await runBulk([...selectedIds.value], (id) => update.mutateAsync({ id, payload: { status: 'DRAFT' } }), 'dijadikan draf');
}
async function bulkDelete(): Promise<void> {
  const deletable = items.value.filter((p) => selectedIds.value.has(p.id) && !p.isMandatory);
  const skipped = selectedCount.value - deletable.length;
  if (deletable.length === 0) {
    toast.warning('Tidak ada halaman yang bisa dihapus (halaman wajib dilewati).');
    return;
  }
  const note = skipped > 0 ? ` ${skipped} halaman wajib akan dilewati.` : '';
  if (await confirm({
    title: 'Hapus massal',
    message: `${deletable.length} halaman akan dihapus permanen.${note}`,
    confirmText: 'Hapus',
    danger: true,
  })) {
    await runBulk(deletable.map((p) => p.id), (id) => remove.mutateAsync(id), 'dihapus');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Halaman" subtitle="Halaman statis (Tentang, Syarat, Privasi, dll).">
      <template #actions>
        <Button @click="router.push('/pages/new')">
          <Plus class="h-4 w-4" />
          Halaman Baru
        </Button>
      </template>
    </PageHeader>

    <div class="mb-4 max-w-xs">
      <SelectInput v-model="status" :options="statusOptions" placeholder="Semua status" />
    </div>

    <!-- Bar aksi massal -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="selectedCount > 0"
        class="bg-primary/5 border-primary/30 mb-4 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 sm:px-4"
      >
        <span class="text-text-primary inline-flex items-center gap-2 text-sm font-semibold">
          <span class="bg-primary flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs text-white">
            {{ selectedCount }}
          </span>
          dipilih
        </span>
        <span class="bg-border mx-1 hidden h-5 w-px sm:block" />
        <div class="flex flex-1 flex-wrap items-center gap-2">
          <Button size="sm" :loading="bulkBusy" @click="bulkPublish">
            <Rocket class="h-3.5 w-3.5" />
            Terbitkan
          </Button>
          <Button size="sm" variant="secondary" :disabled="bulkBusy" @click="bulkDraft">
            <FileText class="h-3.5 w-3.5" />
            Jadikan Draf
          </Button>
          <Button size="sm" variant="secondary" :disabled="bulkBusy" @click="bulkDelete">
            <Trash2 class="h-3.5 w-3.5" />
            Hapus
          </Button>
        </div>
        <button
          type="button"
          aria-label="Batalkan pilihan"
          class="text-text-muted hover:bg-bg-subtle hover:text-text-primary inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          @click="clearSelection"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </Transition>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.items.length === 0"
      empty-text="Belum ada halaman."
    >
      <DataTable
        :columns="columns"
        :rows="data!.items"
        :row-key="(p) => p.id"
        :row-class="(p) => (isSelected(p.id) ? 'bg-primary/5' : '')"
      >
        <template #head-select>
          <input
            type="checkbox"
            class="accent-primary h-4 w-4 cursor-pointer rounded align-middle"
            :checked="allSelected"
            :ref="(el) => el && ((el as HTMLInputElement).indeterminate = someSelected)"
            aria-label="Pilih semua"
            @change="toggleAll"
          />
        </template>
        <template #cell-select="{ row }">
          <input
            type="checkbox"
            class="accent-primary h-4 w-4 cursor-pointer rounded align-middle"
            :checked="isSelected(row.id)"
            :aria-label="`Pilih ${row.title}`"
            @change="toggleRow(row.id)"
          />
        </template>
        <template #cell-title="{ row }">
          <button class="text-text-primary text-left font-medium hover:text-primary" @click="router.push(`/pages/${row.id}/edit`)">
            {{ row.title }}
          </button>
          <Badge v-if="row.isMandatory" variant="warning" class="ml-2">Wajib</Badge>
        </template>
        <template #cell-slug="{ row }">
          <code class="text-text-muted text-xs">/{{ row.slug }}</code>
        </template>
        <template #cell-status="{ row }">
          <Badge :variant="pageStatusVariant[row.status]">{{ pageStatusLabel[row.status] }}</Badge>
        </template>
        <template #cell-updatedAt="{ row }">
          <span class="text-text-muted whitespace-nowrap text-sm">{{ formatDate(row.updatedAt) }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex justify-end">
            <RowActionsMenu :items="rowActions(row)" />
          </div>
        </template>
      </DataTable>

      <div class="mt-4">
        <Pagination
          :page="data!.meta.page"
          :per-page="data!.meta.perPage"
          :total="data!.meta.total"
          :total-pages="data!.meta.totalPages"
          per-page-select
          @update:page="page = $event"
          @update:per-page="perPage = $event"
        />
      </div>
    </QueryState>
  </div>
</template>
