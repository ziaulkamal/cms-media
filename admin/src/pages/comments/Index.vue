<!-- admin/src/pages/comments/Index.vue — antrean moderasi komentar: ringkasan, filter, approve, spam. -->
<script setup lang="ts">
import { computed } from 'vue';
import {
  CheckCircle2,
  Clock3,
  MessagesSquare,
  ShieldAlert,
} from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import CommentCard from '@/components/comments/CommentCard.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import {
  useCommentMutations,
  useCommentsQuery,
  useCommentStatsQuery,
} from '@/composables/useComments';
import { useQueryParam } from '@/composables/useFilters';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import { commentStatusLabel, toOptions } from '@/lib/labels';
import type { CommentModerationStats, ModerationQuery } from '@/types/cms';

const toast = useToast();
const status = useQueryParam('status');
const { page, perPage } = usePagination(20);

const params = computed<ModerationQuery>(() => ({
  page: page.value,
  perPage: perPage.value,
  status: (status.value || undefined) as ModerationQuery['status'],
}));

const { data, isLoading, error } = useCommentsQuery(params);
const { data: stats } = useCommentStatsQuery();
const { approve, spam } = useCommentMutations();
const statusOptions = toOptions(commentStatusLabel);

const busy = computed(() => approve.isPending.value || spam.isPending.value);

/** Kartu ringkasan jumlah komentar per status. */
const summary = computed(() => {
  const s: CommentModerationStats = stats.value ?? {
    total: 0,
    pending: 0,
    approved: 0,
    spam: 0,
  };
  return [
    { key: 'total', label: 'Total', value: s.total, icon: MessagesSquare, tone: 'text-primary bg-primary-light' },
    { key: 'pending', label: 'Menunggu', value: s.pending, icon: Clock3, tone: 'text-warning bg-warning-light' },
    { key: 'approved', label: 'Disetujui', value: s.approved, icon: CheckCircle2, tone: 'text-success bg-success-light' },
    { key: 'spam', label: 'Spam', value: s.spam, icon: ShieldAlert, tone: 'text-danger bg-danger-light' },
  ];
});

/** Bungkus aksi moderasi dengan toast. */
async function run(action: Promise<unknown>, ok: string): Promise<void> {
  try {
    await action;
    toast.success(ok);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Aksi gagal.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Komentar" subtitle="Antrean moderasi komentar pembaca." />

    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="item in summary"
        :key="item.key"
        class="border-border bg-surface flex items-center gap-3 rounded-xl border p-4"
      >
        <span
          :class="item.tone"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        >
          <component :is="item.icon" class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="text-text-primary text-xl font-semibold leading-none">
            {{ item.value }}
          </p>
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
      empty-text="Tidak ada komentar untuk dimoderasi."
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <CommentCard
          v-for="c in data!.items"
          :key="c.id"
          :comment="c"
          :busy="busy"
          @approve="run(approve.mutateAsync($event), 'Komentar disetujui.')"
          @spam="run(spam.mutateAsync($event), 'Komentar ditandai spam.')"
        />
      </div>

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
  </div>
</template>
