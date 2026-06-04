<!-- admin/src/components/ui/Card.vue — wadah surface dengan border & shadow; slot header opsional. -->
<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{ title?: string; subtitle?: string; icon?: Component }>();
</script>

<template>
  <section class="bg-surface border-border rounded-xl border shadow-sm">
    <header
      v-if="title || $slots.header"
      class="border-border flex items-center justify-between gap-3 border-b px-5 py-3.5"
    >
      <div v-if="title" class="flex min-w-0 items-center gap-2.5">
        <span
          v-if="icon"
          class="bg-primary-light text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        >
          <component :is="icon" class="h-4 w-4" />
        </span>
        <div class="min-w-0">
          <h2 class="text-text-primary truncate text-sm font-semibold">{{ title }}</h2>
          <p v-if="subtitle" class="text-text-subtle truncate text-xs">{{ subtitle }}</p>
        </div>
      </div>
      <slot name="header" />
    </header>
    <div class="p-5">
      <slot />
    </div>
  </section>
</template>
