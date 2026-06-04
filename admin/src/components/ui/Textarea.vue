<!-- admin/src/components/ui/Textarea.vue — textarea primitive dengan label & error. -->
<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    rows?: number;
    error?: string;
  }>(),
  { rows: 4 },
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const id = useId();
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-text-primary text-sm font-medium">
      {{ label }}
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      class="border-border bg-surface text-text-primary placeholder:text-text-subtle rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
      :class="error ? 'border-danger' : ''"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="text-danger text-xs">{{ error }}</p>
  </div>
</template>
