<!-- admin/src/components/ui/SearchSelect.vue — select dengan pencarian (gaya Select2) via HeadlessUI Combobox. -->
<script setup lang="ts">
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/vue';
import { Check, ChevronsUpDown, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';

interface Option {
  value: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: ReadonlyArray<Option>;
    placeholder?: string;
  }>(),
  { placeholder: 'Pilih…' },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const query = ref('');

const selected = computed<Option | null>(
  () => props.options.find((o) => o.value === props.modelValue) ?? null,
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

function onSelect(opt: Option | null): void {
  emit('update:modelValue', opt?.value ?? '');
}
function clear(): void {
  emit('update:modelValue', '');
  query.value = '';
}
function displayValue(item: unknown): string {
  return (item as Option | null)?.label ?? '';
}
</script>

<template>
  <Combobox
    as="div"
    class="relative"
    nullable
    :model-value="selected"
    @update:model-value="onSelect"
  >
    <div class="relative">
      <ComboboxInput
        class="border-border bg-surface text-text-primary placeholder:text-text-subtle h-10 w-full rounded-lg border pl-3 pr-14 text-sm outline-none focus:border-primary"
        :display-value="displayValue"
        :placeholder="placeholder"
        @change="query = ($event.target as HTMLInputElement).value"
      />
      <div class="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2">
        <button
          v-if="modelValue"
          type="button"
          class="text-text-subtle hover:text-text-primary rounded p-0.5 transition-colors"
          aria-label="Bersihkan"
          @click="clear"
        >
          <X class="h-3.5 w-3.5" />
        </button>
        <ComboboxButton class="text-text-subtle flex items-center" aria-label="Buka opsi">
          <ChevronsUpDown class="h-4 w-4" />
        </ComboboxButton>
      </div>
    </div>

    <ComboboxOptions
      class="bg-surface border-border absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border p-1 shadow-lg focus:outline-none"
    >
      <div v-if="filtered.length === 0" class="text-text-subtle px-3 py-2 text-sm">
        Tidak ditemukan.
      </div>
      <ComboboxOption
        v-for="opt in filtered"
        :key="opt.value"
        v-slot="{ active, selected: isSel }"
        :value="opt"
      >
        <div
          class="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors"
          :class="active ? 'bg-primary-light text-primary' : 'text-text-primary'"
        >
          <span class="truncate">{{ opt.label }}</span>
          <Check v-if="isSel" class="text-primary h-4 w-4 shrink-0" />
        </div>
      </ComboboxOption>
    </ComboboxOptions>
  </Combobox>
</template>
