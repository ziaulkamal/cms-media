<!-- admin/src/components/dashboard/StatCard.vue — kartu KPI: label + nilai + ikon. -->
<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  label: string;
  value: number | string;
  icon?: Component;
  loading?: boolean;
}>();
</script>

<template>
  <div class="bg-surface border-border flex items-center gap-4 rounded-lg border p-4 shadow-sm">
    <div v-if="icon" class="bg-primary-light text-primary flex h-10 w-10 items-center justify-center rounded-md">
      <component :is="icon" class="h-5 w-5" />
    </div>
    <div>
      <p class="text-text-muted text-xs font-medium uppercase tracking-wide">{{ label }}</p>
      <p class="text-text-primary text-2xl font-semibold">
        <span v-if="loading" class="text-text-subtle">…</span>
        <span v-else>{{ value }}</span>
      </p>
    </div>
  </div>
</template>
