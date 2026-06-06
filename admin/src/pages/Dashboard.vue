<!-- admin/src/pages/Dashboard.vue — ringkasan: KPI, tren publish, dan artikel terbaru. -->
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Newspaper,
  Send,
  Users as UsersIcon,
} from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { articlesApi } from '@/api/articles';
import { commentsApi } from '@/api/comments';
import { mediaApi } from '@/api/media';
import { usersApi } from '@/api/users';
import StatCard from '@/components/dashboard/StatCard.vue';
import TrendChart from '@/components/dashboard/TrendChart.vue';
import Badge from '@/components/ui/Badge.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { articleStatusLabel, articleStatusVariant } from '@/lib/labels';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const isEditorUp = computed(() => auth.hasRole('ADMIN', 'EDITOR'));
const isAdmin = computed(() => auth.hasRole('ADMIN'));

/** Hitung total via meta.total (perPage:1 cukup ringan). */
function totalQuery(key: string, fn: () => Promise<{ meta: { total: number } }>, enabled = computed(() => true)) {
  return useQuery({ queryKey: [key], queryFn: () => fn().then((r) => r.meta.total), enabled });
}

const totalArticles = totalQuery('kpi-articles', () => articlesApi.listManage({ perPage: 1 }));
const publishedArticles = totalQuery('kpi-published', () =>
  articlesApi.listManage({ status: 'PUBLISHED', perPage: 1 }),
);
const draftArticles = totalQuery('kpi-draft', () =>
  articlesApi.listManage({ status: 'DRAFT', perPage: 1 }),
);
const pendingComments = totalQuery(
  'kpi-comments',
  () => commentsApi.moderationList({ status: 'PENDING', perPage: 1 }),
  isEditorUp,
);
const totalMedia = totalQuery('kpi-media', () => mediaApi.list(1, 1));
const totalUsers = totalQuery('kpi-users', () => usersApi.list(1, 1), isAdmin);

// Tren publish 14 hari terakhir.
const publishedList = useQuery({
  queryKey: ['publish-trend'],
  queryFn: () => articlesApi.listManage({ status: 'PUBLISHED', perPage: 100 }),
});

const trend = computed(() => {
  const items = publishedList.data.value?.items ?? [];
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = dayjs().subtract(i, 'day');
    labels.push(day.format('DD/MM'));
    values.push(
      items.filter((a) => a.publishedAt && dayjs(a.publishedAt).isSame(day, 'day')).length,
    );
  }
  return { labels, values };
});

// Artikel terbaru.
const recent = useQuery({
  queryKey: ['recent-articles'],
  queryFn: () => articlesApi.listManage({ perPage: 6 }),
});
</script>

<template>
  <div>
    <PageHeader title="Dashboard" :subtitle="`Halo, ${auth.user?.name ?? ''}`" />

    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Total Berita" :value="totalArticles.data.value ?? 0" :icon="Newspaper" :loading="totalArticles.isLoading.value" />
      <StatCard label="Terbit" :value="publishedArticles.data.value ?? 0" :icon="Send" :loading="publishedArticles.isLoading.value" />
      <StatCard label="Draf" :value="draftArticles.data.value ?? 0" :icon="FileText" :loading="draftArticles.isLoading.value" />
      <StatCard v-if="isEditorUp" label="Komentar Menunggu" :value="pendingComments.data.value ?? 0" :icon="MessageSquare" :loading="pendingComments.isLoading.value" />
      <StatCard label="Media" :value="totalMedia.data.value ?? 0" :icon="ImageIcon" :loading="totalMedia.isLoading.value" />
      <StatCard v-if="isAdmin" label="Pengguna" :value="totalUsers.data.value ?? 0" :icon="UsersIcon" :loading="totalUsers.isLoading.value" />
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card title="Tren Publikasi (14 hari)" class="lg:col-span-2">
        <TrendChart :labels="trend.labels" :values="trend.values" />
      </Card>

      <Card title="Berita Terbaru">
        <ul class="divide-border divide-y">
          <li
            v-for="a in recent.data.value?.items ?? []"
            :key="a.id"
            class="hover:bg-bg-subtle flex items-center justify-between gap-2 py-2.5 px-1"
          >
            <button class="text-text-primary truncate text-left text-sm hover:text-primary" @click="router.push(`/articles/${a.id}/edit`)">
              {{ a.title }}
            </button>
            <Badge :variant="articleStatusVariant[a.status]">{{ articleStatusLabel[a.status] }}</Badge>
          </li>
          <li v-if="(recent.data.value?.items ?? []).length === 0" class="text-text-subtle py-4 text-sm">
            Belum ada artikel.
          </li>
        </ul>
      </Card>
    </div>
  </div>
</template>
