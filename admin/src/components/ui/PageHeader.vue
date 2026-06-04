<!-- admin/src/components/ui/PageHeader.vue — judul halaman + slot aksi (mis. tombol buat). -->
<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <div class="mb-5 flex items-start justify-between gap-4">
    <div>
      <h1 class="text-text-primary text-xl font-semibold">{{ title }}</h1>
      <p v-if="subtitle" class="text-text-muted mt-1 text-sm">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
