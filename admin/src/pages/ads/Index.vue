<!-- admin/src/pages/ads/Index.vue — monetisasi terpadu: tab Slot Iklan & Creative + panduan kontekstual. -->
<script setup lang="ts">
import { ref, type Component } from 'vue';
import { Megaphone, RectangleHorizontal } from 'lucide-vue-next';
import AdsGuide from '@/components/ads/AdsGuide.vue';
import CreativesPanel from '@/components/ads/CreativesPanel.vue';
import SlotsPanel from '@/components/ads/SlotsPanel.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';

type TabKey = 'slots' | 'creatives';

interface Tab {
  key: TabKey;
  label: string;
  icon: Component;
}

const tabs: Tab[] = [
  { key: 'slots', label: 'Slot Iklan', icon: RectangleHorizontal },
  { key: 'creatives', label: 'Creative', icon: Megaphone },
];

const active = ref<TabKey>('slots');
</script>

<template>
  <div>
    <PageHeader title="Monetisasi" subtitle="Kelola slot iklan dan materi creative dalam satu tempat." />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Kolom kiri: tab + panel aktif -->
      <div class="lg:col-span-2">
        <div class="bg-bg-subtle mb-4 inline-flex flex-wrap gap-1 rounded-xl p-1">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            class="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors"
            :class="
              active === t.key
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            "
            @click="active = t.key"
          >
            <component :is="t.icon" class="h-4 w-4" />
            {{ t.label }}
          </button>
        </div>

        <Card>
          <SlotsPanel v-if="active === 'slots'" />
          <CreativesPanel v-else />
        </Card>
      </div>

      <!-- Kolom kanan: panduan accordion (sticky) -->
      <aside class="lg:col-span-1">
        <div class="lg:sticky lg:top-6">
          <AdsGuide :tab="active" />
        </div>
      </aside>
    </div>
  </div>
</template>
