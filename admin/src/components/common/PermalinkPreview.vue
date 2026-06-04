<!-- admin/src/components/common/PermalinkPreview.vue — pratinjau permalink dari judul + struktur tersimpan. -->
<script setup lang="ts">
import { computed } from 'vue';
import { usePublicSettingsQuery } from '@/composables/useSettings';
import { buildPermalink, slugify } from '@/lib/permalink';

const props = withDefaults(
  defineProps<{
    /** Judul untuk diturunkan jadi slug (bila slugOverride kosong). */
    title: string;
    /** Slug eksplisit (mis. field slug kustom halaman). */
    slugOverride?: string;
    /** Tipe konten menentukan struktur permalink yang dipakai. */
    type?: 'article' | 'page';
    /** Slug kategori (untuk token %category% pada artikel). */
    category?: string;
  }>(),
  { type: 'article' },
);

const { data } = usePublicSettingsQuery();

const siteUrl = computed(() => String(data.value?.site_url ?? '').replace(/\/$/, ''));

const structure = computed(() => {
  const key = props.type === 'page' ? 'page_permalink' : 'permalink_structure';
  return String(data.value?.[key] ?? (props.type === 'page' ? '/%pagename%' : '/%postname%'));
});

const slug = computed(() => slugify(props.slugOverride || props.title) || (props.type === 'page' ? 'nama-halaman' : 'judul-artikel'));

const path = computed(() =>
  buildPermalink(structure.value, { slug: slug.value, category: props.category }),
);
</script>

<template>
  <p class="text-text-muted text-xs">
    Permalink:
    <span class="text-text-subtle">{{ siteUrl }}</span><span class="text-primary font-medium">{{ path }}</span>
  </p>
</template>
