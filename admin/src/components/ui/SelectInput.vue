<!-- admin/src/components/ui/SelectInput.vue — select native dengan opsi {value,label}. -->
<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    modelValue: string;
    options: ReadonlyArray<{ value: string; label: string }>;
    label?: string;
    placeholder?: string;
    error?: string;
    /** Tampilkan opsi kosong "semua" di atas (untuk filter). */
    allowEmpty?: boolean;
  }>(),
  { allowEmpty: true },
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const id = useId();
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-text-primary text-sm font-medium">
      {{ label }}
    </label>
    <select
      :id="id"
      :value="modelValue"
      class="border-border bg-surface text-text-primary h-10 rounded-md border px-3 text-sm outline-none focus:border-primary"
      :class="error ? 'border-danger' : ''"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="allowEmpty" value="">{{ placeholder ?? 'Semua' }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="text-danger text-xs">{{ error }}</p>
  </div>
</template>
