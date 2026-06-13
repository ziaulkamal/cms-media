<!-- admin/src/pages/Dashboard.vue — Command Center: KPI ringkas, tren+komposisi, rail "butuh aksi", aksi cepat, top artikel. -->
<script setup lang="ts">
import {
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Newspaper,
  PenLine,
  Radio,
  Send,
  TrendingUp,
  Trophy,
  Upload,
  Users as UsersIcon,
  Zap,
} from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import DonutChart from '@/components/dashboard/DonutChart.vue';
import StatCard from '@/components/dashboard/StatCard.vue';
import TrendChart from '@/components/dashboard/TrendChart.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { formatDate } from '@/lib/format';
import { useDashboardStats } from '@/composables/useDashboard';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const isEditorUp = computed(() => auth.hasRole('ADMIN', 'EDITOR'));
const isAdmin = computed(() => auth.hasRole('ADMIN'));

const { data, isLoading } = useDashboardStats();

const counts = computed(() => data.value?.counts);
const trend = computed(() => data.value?.trend ?? { labels: [], values: [] });
const composition = computed(() =>
  (data.value?.composition ?? []).filter((c) => c.value > 0),
);
const feed = computed(
  () => data.value?.feed ?? { comments: [], contacts: [], liveStreams: [] },
);
const topArticles = computed(() => data.value?.topArticles ?? []);
const maxViews = computed(() =>
  Math.max(1, ...topArticles.value.map((a) => a.viewCount)),
);

/** Total item yang menuntut perhatian (untuk badge header rail). */
const actionTotal = computed(() => {
  const c = counts.value;
  if (!c) return 0;
  return c.pendingComments + (isEditorUp.value ? c.newContacts : 0) + c.liveActive;
});

function go(path: string): void {
  void router.push(path);
}
</script>

<template>
  <div>
    <PageHeader title="Dashboard" :subtitle="`Halo, ${auth.user?.name ?? ''} 👋`" />

    <!-- KPI ringkas -->
    <div class="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Total Berita" :value="counts?.articles ?? 0" :icon="Newspaper" :loading="isLoading" />
      <StatCard label="Terbit" :value="counts?.published ?? 0" :icon="Send" :loading="isLoading" />
      <StatCard label="Draf" :value="counts?.draft ?? 0" :icon="FileText" :loading="isLoading" />
      <StatCard label="Komentar Menunggu" :value="counts?.pendingComments ?? 0" :icon="MessageSquare" :loading="isLoading" />
      <StatCard label="Media" :value="counts?.media ?? 0" :icon="ImageIcon" :loading="isLoading" />
      <StatCard v-if="isAdmin" label="Pengguna" :value="counts?.users ?? 0" :icon="UsersIcon" :loading="isLoading" />
      <StatCard v-else label="Live Aktif" :value="counts?.liveActive ?? 0" :icon="Radio" :loading="isLoading" />
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <!-- Kolom utama: tren + komposisi -->
      <div class="flex flex-col gap-5 lg:col-span-2">
        <Card title="Tren Publikasi (14 hari)" :icon="TrendingUp">
          <TrendChart :labels="trend.labels" :values="trend.values" />
        </Card>

        <Card title="Komposisi Konten" :icon="FileText">
          <DonutChart
            v-if="composition.length"
            :labels="composition.map((c) => c.label)"
            :values="composition.map((c) => c.value)"
          />
          <p v-else class="text-text-subtle py-10 text-center text-sm">Belum ada konten.</p>
        </Card>
      </div>

      <!-- Rail kanan: butuh aksi + aksi cepat -->
      <div class="flex flex-col gap-5">
        <Card title="Butuh Aksi" :icon="Zap">
          <template #header>
            <span
              v-if="actionTotal"
              class="bg-danger-light text-danger rounded-full px-2 py-0.5 text-xs font-semibold"
            >
              {{ actionTotal }}
            </span>
          </template>

          <div class="flex flex-col divide-y divide-border">
            <!-- Komentar menunggu -->
            <button
              v-for="c in feed.comments"
              :key="`cm-${c.id}`"
              type="button"
              class="hover:bg-bg-subtle group flex items-start gap-3 px-1 py-2.5 text-left"
              @click="go('/comments')"
            >
              <span class="bg-warning-light text-warning mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                <MessageSquare class="h-3.5 w-3.5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="text-text-primary block truncate text-sm">
                  <b>{{ c.authorName || 'Anonim' }}</b>: {{ c.body }}
                </span>
                <span class="text-text-subtle text-xs">{{ formatDate(c.createdAt, true) }}</span>
              </span>
            </button>

            <!-- Kontak baru (editor ke atas) -->
            <button
              v-for="m in (isEditorUp ? feed.contacts : [])"
              :key="`ct-${m.id}`"
              type="button"
              class="hover:bg-bg-subtle flex items-start gap-3 px-1 py-2.5 text-left"
              @click="go('/contact')"
            >
              <span class="bg-info-light text-info mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                <Mail class="h-3.5 w-3.5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="text-text-primary block truncate text-sm">
                  <b>{{ m.name }}</b>: {{ m.subject }}
                </span>
                <span class="text-text-subtle text-xs">{{ formatDate(m.createdAt, true) }}</span>
              </span>
            </button>

            <!-- Live aktif -->
            <button
              v-for="l in feed.liveStreams"
              :key="`lv-${l.id}`"
              type="button"
              class="hover:bg-bg-subtle flex items-center gap-3 px-1 py-2.5 text-left"
              @click="go('/live-streams')"
            >
              <span class="bg-danger-light text-danger flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                <Radio class="h-3.5 w-3.5" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="text-text-primary block truncate text-sm font-medium">{{ l.title }}</span>
                <span class="text-text-subtle text-xs">
                  <span class="text-danger font-semibold">● LIVE</span>
                  · {{ l.viewerCount }} penonton
                </span>
              </span>
            </button>

            <p v-if="!actionTotal" class="text-text-subtle py-6 text-center text-sm">
              Tidak ada yang perlu ditindak. 🎉
            </p>
          </div>
        </Card>

        <Card title="Aksi Cepat" :icon="Zap">
          <div class="grid grid-cols-2 gap-2">
            <button class="quick-action" @click="go('/articles/new')">
              <PenLine class="h-4 w-4" /> Tulis Berita
            </button>
            <button class="quick-action" @click="go('/media')">
              <Upload class="h-4 w-4" /> Unggah Media
            </button>
            <button class="quick-action" @click="go('/comments')">
              <MessageSquare class="h-4 w-4" /> Komentar
            </button>
            <button v-if="isEditorUp" class="quick-action" @click="go('/contact')">
              <Mail class="h-4 w-4" /> Pesan Kontak
            </button>
          </div>
        </Card>
      </div>
    </div>

    <!-- Leaderboard artikel terpopuler -->
    <Card title="Berita Terpopuler" :icon="Trophy" class="mt-5">
      <ul class="flex flex-col gap-2.5">
        <li
          v-for="(a, i) in topArticles"
          :key="a.id"
          class="flex items-center gap-3"
        >
          <span class="text-text-subtle w-5 text-right text-sm font-semibold">{{ i + 1 }}</span>
          <button
            class="group min-w-0 flex-1"
            type="button"
            @click="go(`/articles/${a.id}/edit`)"
          >
            <span class="mb-1 flex items-center justify-between gap-2">
              <span class="text-text-primary group-hover:text-primary truncate text-sm">{{ a.title }}</span>
              <span class="text-text-muted inline-flex shrink-0 items-center gap-1 text-xs">
                {{ a.viewCount }} <ArrowUpRight class="h-3 w-3" />
              </span>
            </span>
            <span class="bg-bg-subtle block h-1.5 overflow-hidden rounded-full">
              <span
                class="from-primary to-primary-violet block h-full rounded-full bg-gradient-to-r"
                :style="{ width: `${Math.round((a.viewCount / maxViews) * 100)}%` }"
              />
            </span>
          </button>
        </li>
        <li v-if="topArticles.length === 0" class="text-text-subtle py-4 text-center text-sm">
          Belum ada artikel terbit.
        </li>
      </ul>
    </Card>
  </div>
</template>

<style scoped>
.quick-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
  padding: 0.625rem 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
}
.quick-action:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-surface);
}
</style>
