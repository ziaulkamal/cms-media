<!-- admin/src/pages/contact/Index.vue — inbox kontak: ringkasan, filter status, detail, ubah status, hapus. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { Clock, Inbox, Mail, MailOpen, ShieldAlert, Trash2 } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import Pagination from '@/components/ui/Pagination.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import {
  useContactMutations,
  useContactQuery,
  useContactStatsQuery,
} from '@/composables/useContact';
import { useQueryParam } from '@/composables/useFilters';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import { formatDate } from '@/lib/format';
import { contactStatusLabel, contactStatusVariant, toOptions } from '@/lib/labels';
import type { ContactMessage, ContactQuery, ContactStatus } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const status = useQueryParam('status');
const { page, perPage } = usePagination(20);

const params = computed<ContactQuery>(() => ({
  page: page.value,
  perPage: perPage.value,
  status: (status.value || undefined) as ContactStatus | undefined,
}));

const { data, isLoading, error } = useContactQuery(params);
const { data: stats } = useContactStatsQuery();
const { updateStatus, remove } = useContactMutations();
const statusOptions = toOptions(contactStatusLabel);

/** Kartu ringkasan jumlah pesan per status. */
const summary = computed(() => {
  const s = stats.value ?? { total: 0, new: 0, read: 0, replied: 0, spam: 0, archived: 0 };
  return [
    { key: 'total', label: 'Total', value: s.total, icon: Inbox, tone: 'text-primary bg-primary-light' },
    { key: 'new', label: 'Baru', value: s.new, icon: Mail, tone: 'text-info bg-info-light' },
    { key: 'replied', label: 'Dibalas', value: s.replied, icon: MailOpen, tone: 'text-success bg-success-light' },
    { key: 'spam', label: 'Spam', value: s.spam, icon: ShieldAlert, tone: 'text-danger bg-danger-light' },
  ];
});

// --- Detail ---
const detailOpen = ref(false);
const selected = ref<ContactMessage | null>(null);

async function openDetail(msg: ContactMessage): Promise<void> {
  selected.value = msg;
  detailOpen.value = true;
  // Tandai dibaca otomatis saat pesan baru dibuka.
  if (msg.status === 'NEW') await changeStatus(msg.id, 'READ');
}

async function changeStatus(id: string, value: ContactStatus): Promise<void> {
  try {
    const updated = await updateStatus.mutateAsync({ id, status: value });
    if (selected.value?.id === id) selected.value = updated;
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengubah status.');
  }
}

async function onRemove(id: string): Promise<void> {
  const ok = await confirm({
    title: 'Hapus pesan',
    message: 'Pesan akan dihapus permanen.',
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await remove.mutateAsync(id);
    detailOpen.value = false;
    toast.success('Pesan dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Kontak" subtitle="Inbox pesan dari pengunjung situs." />

    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="item in summary"
        :key="item.key"
        class="border-border bg-surface flex items-center gap-3 rounded-xl border p-4"
      >
        <span :class="item.tone" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <component :is="item.icon" class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="text-text-primary text-xl font-semibold leading-none">{{ item.value }}</p>
          <p class="text-text-muted mt-1 text-xs">{{ item.label }}</p>
        </div>
      </div>
    </div>

    <div class="mb-4 max-w-xs">
      <SelectInput v-model="status" :options="statusOptions" placeholder="Semua status" />
    </div>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.items.length === 0"
      empty-text="Tidak ada pesan."
    >
      <ul class="flex flex-col gap-2">
        <li
          v-for="msg in data!.items"
          :key="msg.id"
          class="group border-border bg-surface hover:border-primary flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors"
          @click="openDetail(msg)"
        >
          <span
            class="bg-primary-light text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          >
            {{ (msg.name[0] ?? '?').toUpperCase() }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <p class="text-text-primary truncate text-sm font-semibold">{{ msg.subject }}</p>
              <Badge :variant="contactStatusVariant[msg.status]">
                {{ contactStatusLabel[msg.status] }}
              </Badge>
            </div>
            <p class="text-text-muted mt-0.5 truncate text-xs">
              {{ msg.name }} · {{ msg.email }}
            </p>
            <p class="text-text-subtle mt-1 line-clamp-2 text-sm">{{ msg.message }}</p>
            <span class="text-text-subtle mt-1 flex items-center gap-1 text-xs">
              <Clock class="h-3 w-3" />{{ formatDate(msg.createdAt, true) }}
            </span>
          </div>
        </li>
      </ul>

      <div class="mt-5">
        <Pagination
          :page="data!.meta.page"
          :per-page="data!.meta.perPage"
          :total="data!.meta.total"
          :total-pages="data!.meta.totalPages"
          @update:page="page = $event"
        />
      </div>
    </QueryState>

    <!-- Detail pesan -->
    <Modal v-model:open="detailOpen" :title="selected?.subject" size="lg">
      <div v-if="selected" class="flex flex-col gap-4">
        <div class="text-sm">
          <p class="text-text-primary font-medium">{{ selected.name }}</p>
          <a :href="`mailto:${selected.email}`" class="text-primary hover:underline">
            {{ selected.email }}
          </a>
        </div>
        <p class="text-text-primary whitespace-pre-line text-sm leading-relaxed">
          {{ selected.message }}
        </p>
        <dl class="text-text-subtle grid grid-cols-2 gap-1 text-xs">
          <dt>Diterima</dt>
          <dd class="text-right">{{ formatDate(selected.createdAt, true) }}</dd>
          <dt>IP</dt>
          <dd class="text-right">{{ selected.ipAddress ?? '—' }}</dd>
        </dl>
      </div>
      <template #footer>
        <div class="mr-auto w-40">
          <SelectInput
            v-if="selected"
            :model-value="selected.status"
            :allow-empty="false"
            :options="statusOptions"
            @update:model-value="changeStatus(selected!.id, $event as ContactStatus)"
          />
        </div>
        <Button variant="danger" @click="onRemove(selected!.id)">
          <Trash2 class="h-4 w-4" /> Hapus
        </Button>
      </template>
    </Modal>
  </div>
</template>
