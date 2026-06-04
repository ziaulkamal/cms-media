<!-- admin/src/components/ui/Alert.vue — kotak pesan kontekstual (info/success/warning/danger). -->
<script setup lang="ts">
import { computed } from 'vue';

type Variant = 'info' | 'success' | 'warning' | 'danger';

const props = withDefaults(defineProps<{ variant?: Variant }>(), {
  variant: 'info',
});

const variants: Record<Variant, string> = {
  info: 'bg-info-light text-info border-info/30',
  success: 'bg-success-light text-success border-success/30',
  warning: 'bg-warning-light text-warning border-warning/30',
  danger: 'bg-danger-light text-danger border-danger/30',
};

const classes = computed(() => variants[props.variant]);
</script>

<template>
  <div :class="classes" class="rounded-md border px-4 py-3 text-sm" role="alert">
    <slot />
  </div>
</template>
