<!-- admin/src/components/ui/BulkActionBar.vue — bar aksi massal: jumlah terpilih + hapus/batal. -->
<script setup lang="ts">
import { Trash2, X } from 'lucide-vue-next';
import Button from '@/components/ui/Button.vue';

defineProps<{ count: number; busy?: boolean }>();
defineEmits<{ (e: 'delete'): void; (e: 'clear'): void }>();
</script>

<template>
  <div
    v-if="count > 0"
    class="border-border bg-surface mb-3 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5"
  >
    <span class="text-text-primary text-sm font-medium">{{ count }} item dipilih</span>
    <div class="flex items-center gap-2">
      <Button size="sm" variant="ghost" @click="$emit('clear')">
        <X class="h-4 w-4" /> Batal
      </Button>
      <Button size="sm" variant="danger" :loading="busy" @click="$emit('delete')">
        <Trash2 class="h-4 w-4" /> Hapus terpilih
      </Button>
    </div>
  </div>
</template>
