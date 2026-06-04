<!-- admin/src/pages/comments/Index.vue — antrean moderasi komentar: filter, approve, spam. -->
<script setup lang="ts">
import { computed } from 'vue';
import { ApiError } from '@/api/http';
import CommentCard from '@/components/comments/CommentCard.vue';
import Pagination from '@/components/ui/Pagination.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import { useCommentMutations, useCommentsQuery } from '@/composables/useComments';
import { useQueryParam } from '@/composables/useFilters';
import { usePagination } from '@/composables/usePagination';
import { useToast } from '@/composables/useToast';
import { commentStatusLabel, toOptions } from '@/lib/labels';
import type { ModerationQuery } from '@/types/cms';

const toast = useToast();
const status = useQueryParam('status');
const { page, perPage } = usePagination(20);

const params = computed<ModerationQuery>(() => ({
  page: page.value,
  perPage: perPage.value,
  status: (status.value || undefined) as ModerationQuery['status'],
}));

const { data, isLoading, error } = useCommentsQuery(params);
const { approve, spam } = useCommentMutations();
const statusOptions = toOptions(commentStatusLabel);

const busy = computed(() => approve.isPending.value || spam.isPending.value);

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

    <div class="mb-4 max-w-xs">
      <SelectInput v-model="status" :options="statusOptions" placeholder="Semua status" />
    </div>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.items.length === 0"
      empty-text="Tidak ada komentar untuk dimoderasi."
    >
      <div class="flex flex-col gap-3">
        <CommentCard
          v-for="c in data!.items"
          :key="c.id"
          :comment="c"
          :busy="busy"
          @approve="run(approve.mutateAsync($event), 'Komentar disetujui.')"
          @spam="run(spam.mutateAsync($event), 'Komentar ditandai spam.')"
        />
      </div>

      <div class="mt-4">
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
