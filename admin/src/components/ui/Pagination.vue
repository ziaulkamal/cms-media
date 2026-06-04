<!-- admin/src/components/ui/Pagination.vue — navigasi halaman: prev/next + info posisi + pilih jumlah per halaman. -->
<script setup lang="ts">
import { computed } from 'vue';
import Button from './Button.vue';

const props = withDefaults(
  defineProps<{
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    /** Tampilkan dropdown jumlah per halaman (perlu handler @update:perPage). */
    perPageSelect?: boolean;
    perPageOptions?: number[];
  }>(),
  { perPageSelect: false, perPageOptions: () => [10, 20, 50, 100] },
);

const emit = defineEmits<{
  'update:page': [value: number];
  'update:perPage': [value: number];
}>();

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.perPage + 1));
const to = computed(() => Math.min(props.page * props.perPage, props.total));
</script>

<template>
  <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
    <div class="text-text-muted flex items-center gap-3 text-sm">
      <template v-if="perPageSelect">
        <label class="flex items-center gap-2">
          <span class="text-text-subtle">Tampilkan</span>
          <select
            :value="perPage"
            class="border-border bg-surface text-text-primary h-8 rounded-md border px-2 text-sm outline-none focus:border-primary"
            @change="emit('update:perPage', Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
        <span class="text-text-subtle">·</span>
      </template>
      <span>{{ from }}–{{ to }} dari {{ total }}</span>
    </div>

    <div class="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        Sebelumnya
      </Button>
      <span class="text-text-muted text-sm">Hal {{ page }} / {{ Math.max(totalPages, 1) }}</span>
      <Button
        variant="secondary"
        size="sm"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        Berikutnya
      </Button>
    </div>
  </div>
</template>
