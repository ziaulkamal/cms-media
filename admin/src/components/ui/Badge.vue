<!-- admin/src/components/ui/Badge.vue — pill status berwarna, didorong prop variant. -->
<script setup lang="ts">
import { computed } from 'vue';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const props = withDefaults(defineProps<{ variant?: BadgeVariant }>(), {
  variant: 'neutral',
});

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-bg-subtle text-text-muted',
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  info: 'bg-info-light text-info',
};

const classes = computed(() => variants[props.variant]);
</script>

<template>
  <span
    :class="classes"
    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
  >
    <slot />
  </span>
</template>
