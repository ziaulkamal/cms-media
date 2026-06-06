<!-- admin/src/pages/tools/Index.vue — tools developer: generator & pembersih data dummy. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  FileText,
  FolderTree,
  Images,
  MessageSquare,
  Tags,
  Trash2,
  TriangleAlert,
} from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useDevMutations, useDummyStatsQuery } from '@/composables/useDev';
import { useToast } from '@/composables/useToast';
import type { DummyCounts, GenerateDummyPayload } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const { data: stats } = useDummyStatsQuery();
const m = useDevMutations();

const articleCount = ref('10');
const galleryCount = ref('12');
const busy = computed(() => m.generate.isPending.value || m.clear.isPending.value);

/** Kartu statistik data dummy saat ini. */
const summary = computed(() => {
  const s: DummyCounts = stats.value ?? {
    categories: 0,
    tags: 0,
    articles: 0,
    comments: 0,
    gallery: 0,
  };
  return [
    { key: 'categories', label: 'Kategori', value: s.categories, icon: FolderTree },
    { key: 'tags', label: 'Tag', value: s.tags, icon: Tags },
    { key: 'articles', label: 'Artikel', value: s.articles, icon: FileText },
    { key: 'comments', label: 'Komentar', value: s.comments, icon: MessageSquare },
    { key: 'gallery', label: 'Foto', value: s.gallery, icon: Images },
  ];
});

/** Rangkai ringkasan jumlah yang dibuat. */
function describe(r: DummyCounts): string {
  const parts: string[] = [];
  if (r.categories) parts.push(`${r.categories} kategori`);
  if (r.tags) parts.push(`${r.tags} tag`);
  if (r.articles) parts.push(`${r.articles} artikel`);
  if (r.comments) parts.push(`${r.comments} komentar`);
  if (r.gallery) parts.push(`${r.gallery} foto`);
  return parts.length ? `${parts.join(', ')} dibuat.` : 'Tidak ada data baru.';
}

async function run(payload: GenerateDummyPayload): Promise<void> {
  try {
    const r = await m.generate.mutateAsync(payload);
    toast.success(describe(r));
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal generate dummy.');
  }
}

const generateAll = () =>
  run({
    categories: true,
    tags: true,
    articles: Number(articleCount.value) || 0,
    comments: true,
    gallery: Number(galleryCount.value) || 0,
  });

async function onClear(): Promise<void> {
  const ok = await confirm({
    title: 'Hapus data dummy',
    message:
      'Semua data berlabel dummy (kategori/tag/artikel/komentar/galeri + berkasnya) akan dihapus permanen.',
    confirmText: 'Hapus semua',
    danger: true,
  });
  if (!ok) return;
  try {
    await m.clear.mutateAsync();
    toast.success('Data dummy dibersihkan.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal membersihkan.');
  }
}
</script>

<template>
  <div>
    <PageHeader title="Tools" subtitle="Generator data dummy untuk pengembangan." />

    <div
      class="text-warning bg-warning-light border-warning/30 mb-5 flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm"
      role="note"
    >
      <TriangleAlert class="h-4 w-4 shrink-0" />
      Hanya tersedia di lingkungan non-produksi. Data berlabel "dummy".
    </div>

    <!-- Statistik data dummy -->
    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div
        v-for="item in summary"
        :key="item.key"
        class="border-border bg-surface flex items-center gap-3 rounded-xl border p-4"
      >
        <span class="text-primary bg-primary-light flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <component :is="item.icon" class="h-4 w-4" />
        </span>
        <div class="min-w-0">
          <p class="text-text-primary text-lg font-semibold leading-none">{{ item.value }}</p>
          <p class="text-text-muted mt-1 text-xs">{{ item.label }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-3">
      <!-- Generator -->
      <div class="lg:col-span-2">
        <Card title="Generate Data Dummy">
          <div class="flex flex-col divide-y divide-border">
            <div class="flex items-center justify-between gap-3 py-3 first:pt-0">
              <span class="text-text-primary text-sm">Kategori <span class="text-text-subtle">(10)</span></span>
              <Button size="sm" variant="secondary" :disabled="busy" @click="run({ categories: true })">Generate</Button>
            </div>
            <div class="flex items-center justify-between gap-3 py-3">
              <span class="text-text-primary text-sm">Tag <span class="text-text-subtle">(10)</span></span>
              <Button size="sm" variant="secondary" :disabled="busy" @click="run({ tags: true })">Generate</Button>
            </div>
            <div class="flex items-center justify-between gap-3 py-3">
              <span class="text-text-primary text-sm">Artikel</span>
              <div class="flex items-center gap-2">
                <div class="w-20"><TextInput v-model="articleCount" type="number" /></div>
                <Button size="sm" variant="secondary" :disabled="busy" @click="run({ articles: Number(articleCount) || 0 })">Generate</Button>
              </div>
            </div>
            <div class="flex items-center justify-between gap-3 py-3">
              <span class="text-text-primary text-sm">
                Komentar
                <span class="text-text-subtle">(pada artikel dummy)</span>
              </span>
              <Button size="sm" variant="secondary" :disabled="busy" @click="run({ comments: true })">Generate</Button>
            </div>
            <div class="flex items-center justify-between gap-3 py-3">
              <span class="text-text-primary text-sm">Foto galeri</span>
              <div class="flex items-center gap-2">
                <div class="w-20"><TextInput v-model="galleryCount" type="number" /></div>
                <Button size="sm" variant="secondary" :disabled="busy" @click="run({ gallery: Number(galleryCount) || 0 })">Generate</Button>
              </div>
            </div>
            <div class="flex items-center justify-between gap-3 py-3 last:pb-0">
              <span class="text-text-primary text-sm font-medium">Semua sekaligus</span>
              <Button size="sm" :loading="m.generate.isPending.value" @click="generateAll">Generate Semua</Button>
            </div>
          </div>
        </Card>
      </div>

      <!-- Pembersih -->
      <div>
        <Card title="Bersihkan">
          <p class="text-text-muted mb-4 text-sm">
            Menghapus seluruh data dummy beserta berkas galeri di storage.
          </p>
          <Button variant="danger" block :loading="m.clear.isPending.value" @click="onClear">
            <Trash2 class="h-4 w-4" /> Hapus Semua Dummy
          </Button>
        </Card>
      </div>
    </div>
  </div>
</template>
