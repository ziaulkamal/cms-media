<!-- admin/src/pages/menus/Index.vue — kelola menu WEB (Main/Footer/Bawah Footer) drag-and-drop. -->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { GripVertical, Plus } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import MenuTree from '@/components/menus/MenuTree.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useMenusQuery, useMenuMutations } from '@/composables/useMenus';
import { useToast } from '@/composables/useToast';
import type {
  MenuLinkType,
  MenuLocation,
  MenuNode,
  ReorderMenuItem,
} from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();

const tabs: { value: MenuLocation; label: string; hint: string }[] = [
  { value: 'MAIN', label: 'Main Menu', hint: 'Navigasi atas (Navbar).' },
  { value: 'FOOTER', label: 'Footer Menu', hint: 'Kolom + item di footer (berjenjang).' },
  { value: 'FOOTER_BOTTOM', label: 'Bawah Footer', hint: 'Bar tautan di bawah footer.' },
];
const location = ref<MenuLocation>('MAIN');
const isFooter = computed(() => location.value === 'FOOTER');

const { data, isLoading, error, refetch } = useMenusQuery(location);
const { create, update, remove, reorder } = useMenuMutations();

// --- Model pohon yang bisa diseret (mutasi in-place oleh draggable) ---
const tree = ref<MenuNode[]>([]);
const cloneTree = (nodes: MenuNode[]): MenuNode[] =>
  nodes.map((n) => ({ ...n, children: cloneTree(n.children) }));

watch(
  data,
  (list) => {
    if (reorder.isPending.value) return;
    tree.value = cloneTree(list ?? []);
  },
  { immediate: true },
);

/** Kolom footer (root) untuk pilihan induk saat membuat item. */
const columnOptions = computed(() =>
  tree.value.map((n) => ({ value: n.id, label: n.label })),
);

/** Datar-kan pohon jadi payload reorder (induk + posisi per saudara). */
function flatten(
  nodes: MenuNode[],
  parentId: string | null = null,
  acc: ReorderMenuItem[] = [],
): ReorderMenuItem[] {
  nodes.forEach((node, index) => {
    acc.push({ id: node.id, parentId, position: index });
    flatten(node.children, node.id, acc);
  });
  return acc;
}

// Persist urutan setelah drag (debounce; satu drag bisa memicu 2 event).
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function onTreeChange(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(persistOrder, 250);
}
async function persistOrder(): Promise<void> {
  try {
    await reorder.mutateAsync({ location: location.value, items: flatten(tree.value) });
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan susunan.');
    void refetch();
  }
}

// --- Modal CRUD ---
const open = ref(false);
const editingId = ref<string | null>(null);
const editingIsColumn = ref(false);
const form = reactive<{
  label: string;
  type: MenuLinkType;
  url: string;
  openInNewTab: boolean;
  placement: string; // '' = kolom baru (footer) / tak dipakai non-footer
}>({ label: '', type: 'ROUTE', url: '', openInNewTab: false, placement: '' });
const fieldError = ref('');

const typeOptions = [
  { value: 'ANCHOR', label: 'Anchor — gulir ke section' },
  { value: 'ROUTE', label: 'Route — halaman internal' },
  { value: 'EXTERNAL', label: 'External — URL / tel / mailto' },
];
const urlPlaceholder = computed(() =>
  form.type === 'ANCHOR' ? 'beranda' : form.type === 'ROUTE' ? '/galeri' : 'https://… / tel:… / mailto:…',
);

// Footer + "kolom baru" → input judul kolom saja (tanpa tautan).
const asColumn = computed(
  () => isFooter.value && !editingId.value && form.placement === '',
);
/** Form tautan (type/url) tampil kecuali sedang membuat/ubah judul kolom. */
const showLink = computed(() => !asColumn.value && !editingIsColumn.value);

function openCreate(): void {
  editingId.value = null;
  editingIsColumn.value = false;
  form.label = '';
  form.type = 'ROUTE';
  form.url = '';
  form.openInNewTab = false;
  form.placement = isFooter.value ? '' : 'flat';
  fieldError.value = '';
  open.value = true;
}

function openEdit(node: MenuNode): void {
  editingId.value = node.id;
  editingIsColumn.value = isFooter.value && node.parentId === null && node.url === null;
  form.label = node.label;
  form.type = node.type;
  form.url = node.url ?? '';
  form.openInNewTab = node.openInNewTab;
  form.placement = node.parentId ?? '';
  fieldError.value = '';
  open.value = true;
}

const saving = computed(() => create.isPending.value || update.isPending.value);

async function onToggleVisible(node: MenuNode): Promise<void> {
  try {
    await update.mutateAsync({ id: node.id, payload: { isVisible: !node.isVisible } });
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengubah visibilitas.');
  }
}

async function onDelete(node: MenuNode): Promise<void> {
  const extra =
    isFooter.value && node.parentId === null && node.children.length
      ? ` beserta ${node.children.length} item di dalamnya`
      : '';
  const ok = await confirm({
    title: 'Hapus item menu',
    message: `"${node.label}"${extra} akan dihapus.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await remove.mutateAsync(node.id);
    toast.success('Item menu dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}

async function onSubmit(): Promise<void> {
  if (!form.label.trim()) {
    fieldError.value = 'Label wajib diisi.';
    return;
  }
  fieldError.value = '';
  try {
    if (editingId.value) {
      const payload = editingIsColumn.value
        ? { label: form.label }
        : { label: form.label, type: form.type, url: form.url || null, openInNewTab: form.openInNewTab };
      await update.mutateAsync({ id: editingId.value, payload });
      toast.success('Item menu diperbarui.');
    } else if (asColumn.value) {
      // Kolom footer baru (judul tanpa tautan).
      await create.mutateAsync({ location: location.value, label: form.label });
      toast.success('Kolom footer dibuat.');
    } else {
      await create.mutateAsync({
        location: location.value,
        parentId: isFooter.value ? form.placement : undefined,
        label: form.label,
        type: form.type,
        url: form.url || null,
        openInNewTab: form.openInNewTab,
      });
      toast.success('Item menu dibuat.');
    }
    open.value = false;
  } catch (e) {
    fieldError.value = e instanceof ApiError ? e.message : 'Gagal menyimpan.';
  }
}
</script>

<template>
  <div>
    <PageHeader title="Menu" subtitle="Kelola menu WEB — seret untuk menyusun urutan & jenjang.">
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" /> Item Baru
        </Button>
      </template>
    </PageHeader>

    <!-- Tab lokasi -->
    <div class="border-border bg-surface mb-4 inline-flex gap-1 rounded-xl border p-1">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        class="rounded-lg px-3.5 py-1.5 text-sm font-medium transition"
        :class="location === t.value ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'"
        @click="location = t.value"
      >
        {{ t.label }}
      </button>
    </div>

    <Card>
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-text-subtle flex items-center gap-1.5 text-xs">
          <GripVertical class="h-3.5 w-3.5" />
          {{ tabs.find((t) => t.value === location)?.hint }} Perubahan urutan tersimpan otomatis.
        </p>
        <span v-if="reorder.isPending.value" class="text-primary text-xs font-medium">Menyimpan…</span>
      </div>

      <QueryState
        :loading="isLoading"
        :error="error"
        :is-empty="!data || data.length === 0"
        empty-text="Belum ada item menu di lokasi ini."
      >
        <MenuTree
          :nodes="tree"
          :nested="isFooter"
          @edit="openEdit"
          @delete="onDelete"
          @toggle-visible="onToggleVisible"
          @change="onTreeChange"
        />
      </QueryState>
    </Card>

    <Modal v-model:open="open" :title="editingId ? 'Edit Item Menu' : 'Item Menu Baru'">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <!-- Penempatan (khusus footer, saat membuat) -->
        <SelectInput
          v-if="isFooter && !editingId"
          v-model="form.placement"
          label="Penempatan"
          :options="[{ value: '', label: 'Kolom baru (judul)' }, ...columnOptions]"
        />

        <TextInput
          v-model="form.label"
          :label="asColumn || editingIsColumn ? 'Judul kolom' : 'Label'"
          required
          :error="fieldError"
        />

        <template v-if="showLink">
          <SelectInput v-model="form.type" label="Jenis tautan" :options="typeOptions" />
          <TextInput v-model="form.url" label="Tautan (URL)" :placeholder="urlPlaceholder" />
          <label v-if="form.type === 'EXTERNAL'" class="text-text-muted flex items-center gap-2 text-sm">
            <input v-model="form.openInNewTab" type="checkbox" class="accent-primary size-4 rounded" />
            Buka di tab baru
          </label>
        </template>
      </form>
      <template #footer>
        <Button variant="secondary" @click="open = false">Batal</Button>
        <Button :loading="saving" @click="onSubmit">Simpan</Button>
      </template>
    </Modal>
  </div>
</template>
