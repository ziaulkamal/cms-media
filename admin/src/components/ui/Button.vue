<!-- admin/src/components/ui/Button.vue — tombol primitive: varian, ukuran, state loading. -->
<script setup lang="ts">
import { computed } from 'vue';
import Spinner from './Spinner.vue';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-primary to-primary-violet text-white border-transparent hover:shadow-glow',
  secondary:
    'bg-surface text-text-primary border-border hover:bg-bg-subtle',
  danger: 'bg-danger text-white hover:opacity-90 border-transparent',
  ghost: 'bg-transparent text-text-muted hover:bg-bg-subtle border-transparent',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

const classes = computed(() => [
  'inline-flex items-center justify-center rounded-md border font-medium transition-colors',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  variants[props.variant],
  sizes[props.size],
  props.block ? 'w-full' : '',
]);
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
  >
    <Spinner v-if="loading" class="h-4 w-4" />
    <slot />
  </button>
</template>
