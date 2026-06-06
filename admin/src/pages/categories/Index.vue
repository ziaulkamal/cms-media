<!-- admin/src/pages/categories/Index.vue — kelola kategori: pohon hierarki drag-and-drop + CRUD + hapus massal. -->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { FolderTree, GripVertical, Layers, FileText } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import CategoryTree, {
  type CategoryNode,
} from '@/components/categories/CategoryTree.vue';
import BulkActionBar from '@/components/ui/BulkActionBar.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import {
  useCategoriesQuery,
  useCategoryMutations,
} from '@/composables/useCategories';
import { useConfirm } from '@/composables/useConfirm';
import { useSelection } from '@/composables/useSelection';
import { useToast } from '@/composables/useToast';
import type { Category, ReorderCategoryItem } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const { data, isLoading, error, refetch } = useCategoriesQuery();
const { create, update, remove, bulkRemove, reorder } = useCategoryMutations();

// --- Statistik ringkas ---
const stats = computed(() => {
  const list = data.value ?? [];
  return {
    total: list.length,
    roots: list.filter((c) => !c.parentId).length,
    articles: list.reduce((sum, c) => sum + (c.articleCount ?? 0), 0),
  };
});

// --- Model pohon yang bisa diseret (mutasi in-place oleh draggable) ---
const tree = ref<CategoryNode[]>([]);

/** Rakit daftar flat -> pohon, terurut posisi. */
function buildTree(list: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sortRec = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

// Bangun ulang model tiap data berubah (kecuali saat sedang menyimpan urutan).
watch(
  data,
  (list) => {
    if (reorder.isPending.value) return;
    tree.value = buildTree(list ?? []);
  },
  { immediate: true },
);

/** Datar-kan pohon jadi payload reorder (induk + posisi per saudara). */
function flatten(
  nodes: CategoryNode[],
  parentId: string | null = null,
  acc: ReorderCategoryItem[] = [],
): ReorderCategoryItem[] {
  nodes.forEach((node, index) => {
    acc.push({
      id: node.id,
      parentId: node.isDefault ? null : parentId, // default selalu di akar
      position: index,
    });
    flatten(node.children, node.id, acc);
  });
  return acc;
}

// Persist urutan setelah drag selesai (debounce: satu drag bisa memicu 2 event).
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function onTreeChange(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persistOrder, 250);
}
async function persistOrder(): Promise<void> {
  try {
    await reorder.mutateAsync(flatten(tree.value));
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan susunan.');
    void refetch(); // kembalikan ke kondisi server
  }
}

// --- Seleksi & hapus massal ---
const sel = useSelection();
const allIds = computed(() => (data.value ?? []).map((c) => c.id));
function toggleAll(on: boolean): void {
  sel.setMany(allIds.value, on);
}
async function onBulkDelete(): Promise<void> {
  const ok = await confirm({
    title: 'Hapus kategori terpilih',
    message: `${sel.count.value} kategori akan dihapus. Artikel terkait dipindah ke kategori default "Article". (Kategori default tidak akan terhapus.)`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await bulkRemove.mutateAsync(sel.ids.value);
    sel.clear();
    toast.success('Kategori terpilih dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}

// --- Modal CRUD ---
const open = ref(false);
const editingId = ref<string | null>(null);
const form = reactive<{ name: string; parentId: string }>({ name: '', parentId: '' });
const fieldError = ref('');

/** Opsi induk (kecuali diri sendiri saat edit). */
const parentOptions = computed(() =>
  (data.value ?? [])
    .filter((c) => c.id !== editingId.value)
    .map((c) => ({ value: c.id, label: c.name })),
);

function openCreate(): void {
  editingId.value = null;
  form.name = '';
  form.parentId = '';
  fieldError.value = '';
  open.value = true;
}

function openEdit(category: Category): void {
  editingId.value = category.id;
  form.name = category.name;
  form.parentId = category.parentId ?? '';
  fieldError.value = '';
  open.value = true;
}

const saving = computed(() => create.isPending.value || update.isPending.value);

/** Hapus kategori tunggal (artikel terkait pindah ke default). */
async function onDelete(category: Category): Promise<void> {
  const ok = await confirm({
    title: 'Hapus kategori',
    message: `Kategori "${category.name}" akan dihapus. ${category.articleCount} artikel terkait dipindah ke kategori default "Article".`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await remove.mutateAsync(category.id);
    toast.success('Kategori dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus kategori.');
  }
}

/** Simpan kategori (create / update). */
async function onSubmit(): Promise<void> {
  if (!form.name.trim()) {
    fieldError.value = 'Nama wajib diisi.';
    return;
  }
  fieldError.value = '';
  try {
    if (editingId.value) {
      // Edit: ubah nama saja; jenjang diatur lewat drag-and-drop.
      await update.mutateAsync({ id: editingId.value, payload: { name: form.name } });
      toast.success('Kategori diperbarui.');
    } else {
      await create.mutateAsync({
        name: form.name,
        parentId: form.parentId || undefined,
      });
      toast.success('Kategori dibuat.');
    }
    open.value = false;
  } catch (e) {
    fieldError.value = e instanceof ApiError ? e.message : 'Gagal menyimpan kategori.';
  }
}
</script>

<template>
  <div>
    <PageHeader title="Kategori" subtitle="Rubrik berita berhierarki — seret untuk menyusun.">
      <template #actions>
        <Button @click="openCreate">Kategori Baru</Button>
      </template>
    </PageHeader>

    <!-- Statistik ringkas -->
    <div class="mb-4 grid grid-cols-3 gap-3">
      <div class="border-border bg-surface flex items-center gap-3 rounded-xl border p-4">
        <span class="bg-primary-light text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <FolderTree class="h-5 w-5" />
        </span>
        <div>
          <p class="text-text-primary text-xl font-semibold leading-none">{{ stats.total }}</p>
          <p class="text-text-muted mt-1 text-xs">Total kategori</p>
        </div>
      </div>
      <div class="border-border bg-surface flex items-center gap-3 rounded-xl border p-4">
        <span class="bg-bg-subtle text-text-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Layers class="h-5 w-5" />
        </span>
        <div>
          <p class="text-text-primary text-xl font-semibold leading-none">{{ stats.roots }}</p>
          <p class="text-text-muted mt-1 text-xs">Rubrik akar</p>
        </div>
      </div>
      <div class="border-border bg-surface flex items-center gap-3 rounded-xl border p-4">
        <span class="bg-bg-subtle text-text-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <FileText class="h-5 w-5" />
        </span>
        <div>
          <p class="text-text-primary text-xl font-semibold leading-none">{{ stats.articles }}</p>
          <p class="text-text-muted mt-1 text-xs">Artikel terkurasi</p>
        </div>
      </div>
    </div>

    <BulkActionBar :count="sel.count.value" :busy="bulkRemove.isPending.value" @delete="onBulkDelete" @clear="sel.clear" />

    <Card>
      <!-- Petunjuk + indikator simpan -->
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-text-subtle flex items-center gap-1.5 text-xs">
          <GripVertical class="h-3.5 w-3.5" />
          Seret gagang untuk mengubah urutan & jenjang. Perubahan tersimpan otomatis.
        </p>
        <span v-if="reorder.isPending.value" class="text-primary text-xs font-medium">Menyimpan…</span>
      </div>

      <QueryState
        :loading="isLoading"
        :error="error"
        :is-empty="!data || data.length === 0"
        empty-text="Belum ada kategori."
      >
        <label v-if="data && data.length" class="text-text-muted mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="accent-primary size-4 rounded"
            :checked="sel.allSelected(allIds)"
            @change="toggleAll(($event.target as HTMLInputElement).checked)"
          />
          Pilih semua
        </label>

        <CategoryTree
          :nodes="tree"
          :selected-ids="sel.selected.value"
          @edit="openEdit"
          @delete="onDelete"
          @toggle-select="sel.toggle"
          @change="onTreeChange"
        />
      </QueryState>
    </Card>

    <Modal v-model:open="open" :title="editingId ? 'Edit Kategori' : 'Kategori Baru'">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <TextInput v-model="form.name" label="Nama" required :error="fieldError" />
        <SelectInput
          v-if="!editingId"
          v-model="form.parentId"
          label="Induk"
          :options="parentOptions"
          placeholder="Tanpa induk (root)"
        />
        <p v-else class="text-text-subtle text-xs">
          Atur induk/jenjang dengan menyeret kategori pada pohon.
        </p>
      </form>
      <template #footer>
        <Button variant="secondary" @click="open = false">Batal</Button>
        <Button :loading="saving" @click="onSubmit">Simpan</Button>
      </template>
    </Modal>
  </div>
</template>
