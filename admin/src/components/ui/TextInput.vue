<!-- admin/src/components/ui/TextInput.vue — input teks primitive dengan label & pesan error. -->
<script setup lang="ts">
import { useId } from 'vue';

withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
    autocomplete?: string;
  }>(),
  { type: 'text' },
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const id = useId();
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-text-primary text-sm font-medium">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :aria-invalid="!!error"
      class="border-border bg-surface text-text-primary placeholder:text-text-subtle h-10 rounded-md border px-3 text-sm outline-none focus:border-primary"
      :class="error ? 'border-danger' : ''"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-danger text-xs">{{ error }}</p>
  </div>
</template>
