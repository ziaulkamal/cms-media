<!-- admin/src/components/articles/SeoPanel.vue — metadata SEO artikel (judul & deskripsi). -->
<script setup lang="ts">
import { computed } from 'vue';
import { Search } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import TagInput from '@/components/ui/TagInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import Textarea from '@/components/ui/Textarea.vue';

const seoTitle = defineModel<string>('seoTitle', { default: '' });
const seoDescription = defineModel<string>('seoDescription', { default: '' });
const seoKeywords = defineModel<string[]>('seoKeywords', { default: () => [] });

/** enableKeywords: tampilkan field keywords (hanya Article; Page belum punya field ini). */
defineProps<{ errors?: Record<string, string>; enableKeywords?: boolean }>();

// Panjang ideal SEO: judul ~60 char, deskripsi ~160 char (batas umum SERP).
const TITLE_IDEAL = 60;
const DESC_IDEAL = 160;
const titleLen = computed(() => seoTitle.value.length);
const descLen = computed(() => seoDescription.value.length);
</script>

<template>
  <Card title="SEO" subtitle="Optimasi untuk mesin pencari" :icon="Search">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <TextInput
          v-model="seoTitle"
          label="SEO Title"
          placeholder="Judul untuk mesin pencari"
          :error="errors?.seoTitle"
        />
        <p class="self-end text-xs" :class="titleLen > TITLE_IDEAL ? 'text-warning' : 'text-text-subtle'">
          {{ titleLen }}/{{ TITLE_IDEAL }} karakter
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <Textarea
          v-model="seoDescription"
          label="SEO Description"
          :rows="3"
          placeholder="Ringkasan untuk hasil pencarian"
          :error="errors?.seoDescription"
        />
        <p class="self-end text-xs" :class="descLen > DESC_IDEAL ? 'text-warning' : 'text-text-subtle'">
          {{ descLen }}/{{ DESC_IDEAL }} karakter
        </p>
      </div>
      <TagInput
        v-if="enableKeywords"
        v-model="seoKeywords"
        label="SEO Keywords"
        placeholder="Ketik keyword lalu koma…"
        :error="errors?.seoKeywords"
      />
    </div>
  </Card>
</template>
