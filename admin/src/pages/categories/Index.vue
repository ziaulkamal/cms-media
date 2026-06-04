<!-- admin/src/pages/categories/Index.vue — kelola kategori: pohon hierarki + modal CRUD. -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ApiError } from '@/api/http';
import CategoryTree, {
  type CategoryNode,
} from '@/components/categories/CategoryTree.vue';
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
import { useToast } from '@/composables/useToast';
import type { Category } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const { data, isLoading, error } = useCategoriesQuery();
const { create, update, remove } = useCategoryMutations();

const open = ref(false);
const editingId = ref<string | null>(null);
const form = reactive<{ name: string; parentId: string }>({ name: '', parentId: '' });
const fieldError = ref('');

/** Rakit daftar flat -> pohon berdasarkan parentId. */
const tree = computed<CategoryNode[]>(() => {
  const list = data.value ?? [];
  const map = new Map<string, CategoryNode>();
  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
});

/** Opsi induk (kecuali diri sendiri saat edit, untuk hindari siklus). */
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

/** Hapus kategori (artikel & sub-kategori terkait jadi tanpa induk). */
async function onDelete(category: Category): Promise<void> {
  const ok = await confirm({
    title: 'Hapus kategori',
    message: `Kategori "${category.name}" akan dihapus. Artikel & sub-kategori terkait menjadi tanpa kategori/induk.`,
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
  fieldError.value = '';
  try {
    const payload = { name: form.name, parentId: form.parentId || undefined };
    if (editingId.value) {
      await update.mutateAsync({ id: editingId.value, payload });
      toast.success('Kategori diperbarui.');
    } else {
      await create.mutateAsync(payload);
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
    <PageHeader title="Kategori" subtitle="Rubrik berita berhierarki.">
      <template #actions>
        <Button @click="openCreate">Kategori Baru</Button>
      </template>
    </PageHeader>

    <Card>
      <QueryState
        :loading="isLoading"
        :error="error"
        :is-empty="!data || data.length === 0"
        empty-text="Belum ada kategori."
      >
        <CategoryTree :nodes="tree" @edit="openEdit" @delete="onDelete" />
      </QueryState>
    </Card>

    <Modal v-model:open="open" :title="editingId ? 'Edit Kategori' : 'Kategori Baru'">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <TextInput v-model="form.name" label="Nama" required :error="fieldError" />
        <SelectInput
          v-model="form.parentId"
          label="Induk"
          :options="parentOptions"
          placeholder="Tanpa induk (root)"
        />
      </form>
      <template #footer>
        <Button variant="secondary" @click="open = false">Batal</Button>
        <Button :loading="saving" @click="onSubmit">Simpan</Button>
      </template>
    </Modal>
  </div>
</template>
