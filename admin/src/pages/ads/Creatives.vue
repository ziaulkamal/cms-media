<!-- admin/src/pages/ads/Creatives.vue — kelola creative per slot (form kondisional per kind). -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ApiError } from '@/api/http';
import CreativeForm from '@/components/ads/CreativeForm.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import DataTable, { type Column } from '@/components/ui/DataTable.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import {
  useAdCreativeMutations,
  useAdCreativesQuery,
  useAdSlotsQuery,
} from '@/composables/useAds';
import { useToast } from '@/composables/useToast';
import { adKindLabel, adPlatformLabel, adStatusLabel, adStatusVariant } from '@/lib/labels';
import type { AdCreative, CreateAdCreativePayload } from '@/types/cms';

const toast = useToast();
const { data: slots, isLoading: slotsLoading } = useAdSlotsQuery();
const slotId = ref('');

// Pilih slot pertama otomatis saat daftar termuat.
watch(
  () => slots.value,
  (list) => {
    if (!slotId.value && list && list.length > 0) slotId.value = list[0].id;
  },
  { immediate: true },
);

const slotIdRef = computed(() => slotId.value || undefined);
const { data: creatives, isLoading, error } = useAdCreativesQuery(slotIdRef);
const { create, update } = useAdCreativeMutations();

const slotOptions = computed(() =>
  (slots.value ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.key})` })),
);

const open = ref(false);
const editing = ref<AdCreative | null>(null);
const formRef = ref<{ submit: () => void } | null>(null);

const columns: Column[] = [
  { key: 'name', label: 'Nama' },
  { key: 'kind', label: 'Jenis' },
  { key: 'platform', label: 'Platform' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Prioritas', align: 'right' },
  { key: 'actions', label: '', align: 'right' },
];

function openCreate(): void {
  editing.value = null;
  open.value = true;
}
function openEdit(c: AdCreative): void {
  editing.value = c;
  open.value = true;
}

const saving = computed(() => create.isPending.value || update.isPending.value);

/** Terima payload dari CreativeForm lalu create/update. */
async function onSubmit(payload: CreateAdCreativePayload): Promise<void> {
  try {
    if (editing.value) {
      await update.mutateAsync({ id: editing.value.id, payload });
      toast.success('Creative diperbarui.');
    } else {
      await create.mutateAsync({ slotId: slotId.value, payload });
      toast.success('Creative dibuat.');
    }
    open.value = false;
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan creative.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Creative Iklan" subtitle="Materi iklan per slot.">
      <template #actions>
        <Button :disabled="!slotId" @click="openCreate">Creative Baru</Button>
      </template>
    </PageHeader>

    <div class="mb-4 max-w-sm">
      <SelectInput
        v-model="slotId"
        label="Slot"
        :allow-empty="false"
        :options="slotOptions"
        :placeholder="slotsLoading ? 'Memuat slot…' : 'Pilih slot'"
      />
    </div>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!creatives || creatives.length === 0"
      empty-text="Belum ada creative pada slot ini."
    >
      <DataTable :columns="columns" :rows="creatives!" :row-key="(c) => c.id">
        <template #cell-kind="{ row }">{{ adKindLabel[row.kind] }}</template>
        <template #cell-platform="{ row }">{{ adPlatformLabel[row.platform] }}</template>
        <template #cell-status="{ row }">
          <Badge :variant="adStatusVariant[row.status]">{{ adStatusLabel[row.status] }}</Badge>
        </template>
        <template #cell-actions="{ row }">
          <Button size="sm" variant="secondary" @click="openEdit(row)">Edit</Button>
        </template>
      </DataTable>
    </QueryState>

    <Modal v-model:open="open" :title="editing ? 'Edit Creative' : 'Creative Baru'">
      <CreativeForm ref="formRef" :initial="editing" @submit="onSubmit" />
      <template #footer>
        <Button variant="secondary" @click="open = false">Batal</Button>
        <Button :loading="saving" @click="formRef?.submit()">Simpan</Button>
      </template>
    </Modal>
  </div>
</template>
