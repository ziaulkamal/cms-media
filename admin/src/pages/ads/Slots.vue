<!-- admin/src/pages/ads/Slots.vue — kelola slot iklan (posisi bernama, dimensi, AMP, aktif). -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ApiError } from '@/api/http';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import DataTable, { type Column } from '@/components/ui/DataTable.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useAdSlotMutations, useAdSlotsQuery } from '@/composables/useAds';
import { useToast } from '@/composables/useToast';
import type { AdSlot } from '@/types/cms';

const toast = useToast();
const { data, isLoading, error } = useAdSlotsQuery();
const { create, update } = useAdSlotMutations();

const open = ref(false);
const editingId = ref<string | null>(null);
const formError = ref('');
const form = reactive({
  key: '',
  name: '',
  description: '',
  width: '',
  height: '',
  isAmpEnabled: false,
  isActive: true,
});

const columns: Column[] = [
  { key: 'key', label: 'Key' },
  { key: 'name', label: 'Nama' },
  { key: 'size', label: 'Dimensi' },
  { key: 'amp', label: 'AMP' },
  { key: 'active', label: 'Aktif' },
  { key: 'actions', label: '', align: 'right' },
];

function openCreate(): void {
  editingId.value = null;
  formError.value = '';
  Object.assign(form, {
    key: '',
    name: '',
    description: '',
    width: '',
    height: '',
    isAmpEnabled: false,
    isActive: true,
  });
  open.value = true;
}

function openEdit(slot: AdSlot): void {
  editingId.value = slot.id;
  formError.value = '';
  Object.assign(form, {
    key: slot.key,
    name: slot.name,
    description: slot.description ?? '',
    width: slot.width?.toString() ?? '',
    height: slot.height?.toString() ?? '',
    isAmpEnabled: slot.isAmpEnabled,
    isActive: slot.isActive,
  });
  open.value = true;
}

const saving = computed(() => create.isPending.value || update.isPending.value);

/** Simpan slot (create memerlukan key; update tanpa key). */
async function onSubmit(): Promise<void> {
  formError.value = '';
  const base = {
    name: form.name,
    description: form.description || undefined,
    width: form.width ? Number(form.width) : undefined,
    height: form.height ? Number(form.height) : undefined,
    isAmpEnabled: form.isAmpEnabled,
    isActive: form.isActive,
  };
  try {
    if (editingId.value) {
      await update.mutateAsync({ id: editingId.value, payload: base });
      toast.success('Slot diperbarui.');
    } else {
      await create.mutateAsync({ key: form.key, ...base });
      toast.success('Slot dibuat.');
    }
    open.value = false;
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : 'Gagal menyimpan slot.';
  }
}
</script>

<template>
  <div>
    <PageHeader title="Slot Iklan" subtitle="Posisi iklan bernama pada situs.">
      <template #actions>
        <Button @click="openCreate">Slot Baru</Button>
      </template>
    </PageHeader>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.length === 0"
      empty-text="Belum ada slot iklan."
    >
      <DataTable :columns="columns" :rows="data!" :row-key="(s) => s.id">
        <template #cell-key="{ row }">
          <code class="text-text-primary text-xs">{{ row.key }}</code>
        </template>
        <template #cell-size="{ row }">
          {{ row.width && row.height ? `${row.width}×${row.height}` : '—' }}
        </template>
        <template #cell-amp="{ row }">
          <Badge :variant="row.isAmpEnabled ? 'info' : 'neutral'">
            {{ row.isAmpEnabled ? 'Ya' : 'Tidak' }}
          </Badge>
        </template>
        <template #cell-active="{ row }">
          <Badge :variant="row.isActive ? 'success' : 'neutral'">
            {{ row.isActive ? 'Aktif' : 'Nonaktif' }}
          </Badge>
        </template>
        <template #cell-actions="{ row }">
          <Button size="sm" variant="secondary" @click="openEdit(row)">Edit</Button>
        </template>
      </DataTable>
    </QueryState>

    <Modal v-model:open="open" :title="editingId ? 'Edit Slot' : 'Slot Baru'">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <TextInput
          v-if="!editingId"
          v-model="form.key"
          label="Key"
          placeholder="home_top"
          required
        />
        <TextInput v-model="form.name" label="Nama" required :error="formError" />
        <TextInput v-model="form.description" label="Deskripsi" />
        <div class="grid grid-cols-2 gap-3">
          <TextInput v-model="form.width" label="Lebar (px)" type="number" />
          <TextInput v-model="form.height" label="Tinggi (px)" type="number" />
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.isAmpEnabled" type="checkbox" class="accent-primary" />
          Tampil di halaman AMP
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.isActive" type="checkbox" class="accent-primary" />
          Aktif
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="open = false">Batal</Button>
        <Button :loading="saving" @click="onSubmit">Simpan</Button>
      </template>
    </Modal>
  </div>
</template>
