<!-- admin/src/components/common/PermalinkPreview.vue — pratinjau tautan ke situs publik PORA (FE) dari judul/slug. -->
<script setup lang="ts">
import { computed } from 'vue';
import { ExternalLink } from 'lucide-vue-next';
import { usePublicSettingsQuery } from '@/composables/useSettings';
import { slugify } from '@/lib/permalink';

const props = withDefaults(
  defineProps<{
    /** Judul untuk diturunkan jadi slug (bila slugOverride kosong). */
    title: string;
    /** Slug eksplisit (mis. field slug kustom laman). */
    slugOverride?: string;
    /** Tipe konten menentukan rute FE yang dipakai. */
    type?: 'article' | 'page';
    /** Slug kategori — tak dipakai rute FE saat ini (dipertahankan utk kompat). */
    category?: string;
  }>(),
  { type: 'article' },
);

const { data } = usePublicSettingsQuery();

/** Basis URL situs publik PORA (FE); utamakan frontend_url, fallback site_url. */
const baseUrl = computed(() =>
  String(data.value?.frontend_url ?? data.value?.site_url ?? '').replace(/\/$/, ''),
);

const slug = computed(
  () =>
    slugify(props.slugOverride || props.title) ||
    (props.type === 'page' ? 'nama-laman' : 'judul-berita'),
);

/**
 * Path rute FE (PoraAcehJaya-FE pakai HashRouter):
 * berita di `/#/berita/:slug`, laman di `/#/:slug`.
 */
const path = computed(() =>
  props.type === 'page' ? `/#/${slug.value}` : `/#/berita/${slug.value}`,
);

const url = computed(() => `${baseUrl.value}${path.value}`);
</script>

<template>
  <p class="text-text-muted text-xs">
    Permalink:
    <a
      v-if="baseUrl"
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
      class="text-primary inline-flex items-center gap-1 font-medium hover:underline"
      title="Buka pratinjau di situs publik"
    >
      <span class="text-text-subtle">{{ baseUrl }}</span>{{ path }}
      <ExternalLink class="h-3 w-3 shrink-0" />
    </a>
    <span v-else class="text-text-subtle">
      {{ path }} <em>(atur “URL Frontend” di Pengaturan untuk pratinjau)</em>
    </span>
  </p>
</template>
