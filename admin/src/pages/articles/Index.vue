<!-- admin/src/pages/articles/Index.vue — daftar artikel: filter + tabel + aksi workflow. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Archive, Eye, FileText, ImageOff, PencilLine, Plus, Rocket, Search, Send, SlidersHorizontal, X } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import DataTable, { type Column } from '@/components/ui/DataTable.vue';
import Modal from '@/components/ui/Modal.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import RowActionsMenu, { type RowAction } from '@/components/ui/RowActionsMenu.vue';
import SearchSelect from '@/components/ui/SearchSelect.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import { useArticleMutations, useArticlesQuery } from '@/composables/useArticles';
import { useCategoriesQuery } from '@/composables/useCategories';
import { useConfirm } from '@/composables/useConfirm';
import { useTagsQuery } from '@/composables/useTags';
import { useQueryParam } from '@/composables/useFilters';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import {
  articleStatusLabel,
  articleStatusVariant,
} from '@/lib/labels';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';
import type { Article, ArticleQuery, ArticleStatus } from '@/types/cms';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const canPublish = computed(() => auth.hasRole('ADMIN', 'EDITOR'));

const status = useQueryParam('status');
const category = useQueryParam('category');
const tag = useQueryParam('tag');
const q = useQueryParam('q');
const { page, perPage } = usePagination(20);

const params = computed<ArticleQuery>(() => ({
  page: page.value,
  perPage: perPage.value,
  status: (status.value || undefined) as ArticleQuery['status'],
  category: category.value || undefined,
  tag: tag.value || undefined,
  q: q.value || undefined,
}));

const { data, isLoading, error } = useArticlesQuery(params);
const { data: categories } = useCategoriesQuery();
const { data: tags } = useTagsQuery();
const { submit, publish, archive, draft, update } = useArticleMutations();

const categoryOptions = computed(() =>
  (categories.value ?? []).map((c) => ({ value: c.slug, label: c.name })),
);
const tagOptions = computed(() =>
  (tags.value ?? []).map((t) => ({ value: t.slug, label: t.name })),
);
/** Opsi kategori berbasis id (untuk edit massal, beda dari filter yang pakai slug). */
const categoryIdOptions = computed(() =>
  (categories.value ?? []).map((c) => ({ value: c.id, label: c.name })),
);

/** Pill filter status (workflow), termasuk "Semua". */
const statusFilters = [
  { value: '', label: 'Semua' },
  ...(Object.keys(articleStatusLabel) as ArticleStatus[]).map((value) => ({
    value,
    label: articleStatusLabel[value],
  })),
];

/** Warna titik indikator status (solid, beda dari badge light). */
const statusDot: Record<ArticleStatus, string> = {
  DRAFT: 'bg-text-subtle',
  IN_REVIEW: 'bg-warning',
  SCHEDULED: 'bg-info',
  PUBLISHED: 'bg-success',
  ARCHIVED: 'bg-text-subtle',
};

const columns: Column[] = [
  { key: 'select', label: '', class: 'w-10' },
  { key: 'title', label: 'Judul' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'author', label: 'Penulis', class: 'hidden lg:table-cell', sortable: true },
  { key: 'publishedAt', label: 'Terbit', class: 'hidden md:table-cell' },
  { key: 'actions', label: 'Aksi', align: 'right' },
];

/** Kolom yang sedang dipakai mengelompokkan (klik header Status/Penulis). */
const groupField = ref<'' | 'status' | 'author'>('');
const statusOrder = Object.keys(articleStatusLabel) as ArticleStatus[];

function onSort(key: string): void {
  if (key !== 'status' && key !== 'author') return;
  groupField.value = groupField.value === key ? '' : key;
}

/** Baris untuk tabel: diurutkan agar grup berdekatan saat grouping aktif. */
const displayRows = computed<Article[]>(() => {
  const list = data.value?.items ?? [];
  if (!groupField.value) return [...list];
  const copy = [...list];
  if (groupField.value === 'status') {
    copy.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
  } else {
    copy.sort((a, b) => a.author.name.localeCompare(b.author.name, 'id'));
  }
  return copy;
});

/** Label grup per baris (null bila grouping mati). */
function groupLabel(row: Article): string | null {
  if (groupField.value === 'status') return articleStatusLabel[row.status];
  if (groupField.value === 'author') return row.author.name;
  return null;
}

/** Inisial dari nama penulis untuk avatar. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Jalankan aksi mutasi + toast hasil (sukses/gagal). */
async function run(action: Promise<unknown>, ok: string): Promise<void> {
  try {
    await action;
    toast.success(ok);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Aksi gagal.');
  }
}

function onEdit(a: Article): void {
  void router.push(`/articles/${a.id}/edit`);
}

/** Susun item menu aksi sesuai status & hak akses. */
function rowActions(row: Article): RowAction[] {
  const items: RowAction[] = [
    { label: 'Edit artikel', icon: PencilLine, onClick: () => onEdit(row) },
  ];
  if (row.status === 'DRAFT') {
    items.push({
      label: 'Ajukan untuk review',
      icon: Send,
      onClick: () => run(submit.mutateAsync(row.id), 'Artikel diajukan untuk review.'),
    });
  }
  if (canPublish.value && row.status !== 'PUBLISHED' && row.status !== 'ARCHIVED') {
    items.push({
      label: 'Terbitkan sekarang',
      icon: Rocket,
      onClick: () => run(publish.mutateAsync({ id: row.id }), 'Artikel diterbitkan.'),
    });
  }
  if (row.status !== 'ARCHIVED') {
    items.push({
      label: 'Arsipkan',
      icon: Archive,
      danger: true,
      onClick: () => run(archive.mutateAsync(row.id), 'Artikel diarsipkan.'),
    });
  }
  return items;
}

// ── Seleksi & aksi massal ────────────────────────────────────────────────
const items = computed(() => data.value?.items ?? []);
const selectedIds = ref<Set<string>>(new Set());
const selectedCount = computed(() => selectedIds.value.size);
const allSelected = computed(
  () => items.value.length > 0 && items.value.every((a) => selectedIds.value.has(a.id)),
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
    : new Set(items.value.map((a) => a.id));
}
function clearSelection(): void {
  selectedIds.value = new Set();
}

// Bersihkan seleksi saat filter/halaman berubah (hindari aksi pada item tak terlihat).
watch(params, clearSelection);

/** Jalankan mutasi untuk tiap id terpilih; ringkas hasil sukses/gagal. */
async function runBulk(fn: (id: string) => Promise<unknown>, okLabel: string): Promise<void> {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  bulkBusy.value = true;
  try {
    const results = await Promise.allSettled(ids.map((id) => fn(id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    if (fail === 0) toast.success(`${ok} artikel ${okLabel}.`);
    else if (ok === 0) toast.error(`Gagal memproses ${fail} artikel.`);
    else toast.info(`${ok} ${okLabel}, ${fail} gagal.`);
    clearSelection();
  } finally {
    bulkBusy.value = false;
  }
}

async function bulkPublish(): Promise<void> {
  if (await confirm({ title: 'Terbitkan massal', message: `Terbitkan ${selectedCount.value} artikel terpilih sekarang?`, confirmText: 'Terbitkan' }))
    await runBulk((id) => publish.mutateAsync({ id }), 'diterbitkan');
}
async function bulkDraft(): Promise<void> {
  if (await confirm({ title: 'Jadikan draf', message: `Kembalikan ${selectedCount.value} artikel ke status draf?`, confirmText: 'Jadikan Draf' }))
    await runBulk((id) => draft.mutateAsync(id), 'dijadikan draf');
}
async function bulkArchive(): Promise<void> {
  if (await confirm({ title: 'Arsipkan massal', message: `Arsipkan ${selectedCount.value} artikel terpilih?`, danger: true, confirmText: 'Arsipkan' }))
    await runBulk((id) => archive.mutateAsync(id), 'diarsipkan');
}

// ── Edit massal (kategori & tag) ─────────────────────────────────────────
const bulkEditOpen = ref(false);
const bulkCategoryId = ref(''); // '' = jangan ubah kategori
const bulkApplyTags = ref(false);
const bulkTagIds = ref<string[]>([]);

function openBulkEdit(): void {
  bulkCategoryId.value = '';
  bulkApplyTags.value = false;
  bulkTagIds.value = [];
  bulkEditOpen.value = true;
}
function toggleBulkTag(id: string): void {
  bulkTagIds.value = bulkTagIds.value.includes(id)
    ? bulkTagIds.value.filter((t) => t !== id)
    : [...bulkTagIds.value, id];
}
async function applyBulkEdit(): Promise<void> {
  const payload: { categoryId?: string; tagIds?: string[] } = {};
  if (bulkCategoryId.value) payload.categoryId = bulkCategoryId.value;
  if (bulkApplyTags.value) payload.tagIds = bulkTagIds.value;
  if (payload.categoryId === undefined && payload.tagIds === undefined) {
    toast.info('Tidak ada perubahan untuk diterapkan.');
    return;
  }
  bulkEditOpen.value = false;
  await runBulk((id) => update.mutateAsync({ id, payload }), 'diperbarui');
}
</script>

<template>
  <div>
    <PageHeader title="Berita" subtitle="Kelola dan terbitkan konten berita.">
      <template #actions>
        <Button @click="router.push('/articles/new')">
          <Plus class="h-4 w-4" />
          Tulis Berita
        </Button>
      </template>
    </PageHeader>

    <!-- Toolbar filter -->
    <div class="bg-surface border-border mb-4 rounded-xl border p-3 shadow-sm sm:p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <Search
            class="text-text-subtle pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          />
          <input
            v-model="q"
            type="search"
            placeholder="Cari judul atau isi artikel…"
            class="border-border bg-bg-subtle/50 text-text-primary placeholder:text-text-subtle focus:bg-surface h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div class="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <SearchSelect
            v-model="category"
            :options="categoryOptions"
            placeholder="Semua kategori"
            class="sm:w-48"
          />
          <SearchSelect
            v-model="tag"
            :options="tagOptions"
            placeholder="Semua tag"
            class="sm:w-44"
          />
        </div>
      </div>

      <!-- Segmented status -->
      <div class="border-border mt-3 flex flex-wrap gap-1.5 border-t pt-3">
        <button
          v-for="f in statusFilters"
          :key="f.value || 'all'"
          type="button"
          class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
          :class="
            status === f.value
              ? 'bg-primary text-white shadow-sm'
              : 'bg-bg-subtle text-text-muted hover:bg-bg-subtle hover:text-text-primary'
          "
          @click="status = f.value"
        >
          {{ f.label }}
        </button>
      </div>
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
          <Button size="sm" variant="secondary" :disabled="bulkBusy" @click="openBulkEdit">
            <SlidersHorizontal class="h-3.5 w-3.5" />
            Edit massal
          </Button>
          <Button v-if="canPublish" size="sm" :loading="bulkBusy" @click="bulkPublish">
            <Rocket class="h-3.5 w-3.5" />
            Terbitkan
          </Button>
          <Button size="sm" variant="secondary" :disabled="bulkBusy" @click="bulkDraft">
            <Send class="h-3.5 w-3.5" />
            Jadikan Draf
          </Button>
          <Button size="sm" variant="secondary" :disabled="bulkBusy" @click="bulkArchive">
            <Archive class="h-3.5 w-3.5" />
            Arsipkan
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
    >
      <template #empty>
        <div class="flex flex-col items-center gap-3 py-6">
          <span
            class="bg-primary-light text-primary flex h-14 w-14 items-center justify-center rounded-full"
          >
            <FileText class="h-7 w-7" />
          </span>
          <div class="text-center">
            <p class="text-text-primary text-sm font-semibold">Belum ada artikel</p>
            <p class="text-text-muted mt-0.5 text-sm">
              Tidak ada artikel yang cocok dengan filter saat ini.
            </p>
          </div>
          <Button size="sm" @click="router.push('/articles/new')">
            <Plus class="h-4 w-4" />
            Tulis Artikel Pertama
          </Button>
        </div>
      </template>

      <DataTable
        :columns="columns"
        :rows="displayRows"
        :row-key="(a) => a.id"
        :row-class="(a) => (isSelected(a.id) ? 'bg-primary/5' : '')"
        :group-by="groupLabel"
        :active-sort="groupField || null"
        @sort="onSort"
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
          <div class="flex items-center gap-3">
            <div
              class="border-border bg-bg-subtle relative h-10 w-14 shrink-0 overflow-hidden rounded-md border"
            >
              <img
                v-if="row.featuredMedia"
                :src="row.featuredMedia.url"
                :alt="row.featuredMedia.alt ?? ''"
                class="h-full w-full object-cover"
              />
              <span
                v-else
                class="text-text-subtle flex h-full w-full items-center justify-center"
              >
                <ImageOff class="h-4 w-4" />
              </span>
            </div>
            <div class="min-w-0 max-w-[20rem]">
              <button
                class="text-text-primary hover:text-primary block truncate text-left text-sm font-semibold transition-colors"
                @click="onEdit(row)"
              >
                {{ row.title }}
              </button>
              <p v-if="row.excerpt" class="text-text-muted mt-0.5 truncate text-xs">
                {{ row.excerpt }}
              </p>
              <div class="text-text-subtle mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                <span v-if="row.category" class="bg-bg-subtle text-text-muted rounded px-1.5 py-0.5 font-medium">
                  {{ row.category.name }}
                </span>
                <span class="inline-flex items-center gap-1 tabular-nums">
                  <Eye class="h-3 w-3" />
                  {{ row.viewCount.toLocaleString('id-ID') }}
                </span>
                <template v-if="row.tags.length">
                  <span class="text-border-strong">·</span>
                  <span
                    v-for="t in row.tags.slice(0, 2)"
                    :key="t.id"
                    class="text-primary font-medium"
                  >
                    #{{ t.name }}
                  </span>
                  <span v-if="row.tags.length > 2">+{{ row.tags.length - 2 }}</span>
                </template>
              </div>
            </div>
          </div>
        </template>
        <template #cell-status="{ row }">
          <Badge :variant="articleStatusVariant[row.status]">
            <span class="h-1.5 w-1.5 rounded-full" :class="statusDot[row.status]" />
            {{ articleStatusLabel[row.status] }}
          </Badge>
        </template>
        <template #cell-author="{ row }">
          <div class="flex items-center gap-2">
            <span
              class="from-primary to-primary-violet flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-white"
            >
              {{ initials(row.author.name) }}
            </span>
            <span class="text-text-primary max-w-[9rem] truncate text-sm">{{ row.author.name }}</span>
          </div>
        </template>
        <template #cell-publishedAt="{ row }">
          <span class="text-text-muted whitespace-nowrap text-sm">{{ formatDate(row.publishedAt) }}</span>
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

    <!-- Modal edit massal -->
    <Modal
      v-model:open="bulkEditOpen"
      title="Edit massal"
      :description="`Terapkan ke ${selectedCount} artikel terpilih. Field yang dibiarkan kosong tidak diubah.`"
    >
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <label class="text-text-primary text-sm font-medium">Kategori</label>
          <SelectInput
            v-model="bulkCategoryId"
            :options="categoryIdOptions"
            placeholder="— Jangan ubah —"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-2 text-sm font-medium">
            <input v-model="bulkApplyTags" type="checkbox" class="accent-primary h-4 w-4 rounded" />
            <span class="text-text-primary">Ganti tag artikel terpilih</span>
          </label>
          <div
            v-if="bulkApplyTags"
            class="border-border flex flex-wrap gap-1.5 rounded-lg border p-3"
          >
            <button
              v-for="t in tags ?? []"
              :key="t.id"
              type="button"
              class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
              :class="
                bulkTagIds.includes(t.id)
                  ? 'bg-primary text-white'
                  : 'bg-bg-subtle text-text-muted hover:bg-border'
              "
              @click="toggleBulkTag(t.id)"
            >
              {{ t.name }}
            </button>
            <span v-if="(tags ?? []).length === 0" class="text-text-subtle text-sm">
              Belum ada tag.
            </span>
            <p v-else-if="bulkTagIds.length === 0" class="text-text-subtle w-full text-xs">
              Tanpa tag yang dipilih → tag artikel akan dikosongkan.
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="bulkEditOpen = false">Batal</Button>
        <Button :loading="bulkBusy" @click="applyBulkEdit">Terapkan</Button>
      </template>
    </Modal>
  </div>
</template>
