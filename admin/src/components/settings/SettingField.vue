<!-- admin/src/components/settings/SettingField.vue — render input nilai setting sesuai SettingType. -->
<script setup lang="ts">
import { computed } from 'vue';
import TextInput from '@/components/ui/TextInput.vue';
import Textarea from '@/components/ui/Textarea.vue';
import type { SettingType } from '@/types/cms';

const props = defineProps<{ type: SettingType; label?: string }>();
const model = defineModel<unknown>();

/** Proxy string dua-arah dengan konversi tipe sesuai SettingType. */
const text = computed<string>({
  get: () => {
    if (model.value == null) return '';
    if (props.type === 'JSON') return JSON.stringify(model.value, null, 2);
    return String(model.value);
  },
  set: (raw) => {
    if (props.type === 'NUMBER') model.value = raw === '' ? null : Number(raw);
    else if (props.type === 'JSON') {
      try {
        model.value = JSON.parse(raw);
      } catch {
        model.value = raw; // simpan mentah bila JSON belum valid
      }
    } else model.value = raw;
  },
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="props.type !== 'BOOLEAN'" class="text-text-primary text-sm font-medium">
      {{ label }}
    </label>

    <label v-if="props.type === 'BOOLEAN'" class="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        class="accent-primary"
        :checked="!!model"
        @change="model = ($event.target as HTMLInputElement).checked"
      />
      {{ label }}
    </label>

    <Textarea
      v-else-if="props.type === 'TEXT' || props.type === 'JSON'"
      v-model="text"
      :rows="props.type === 'JSON' ? 5 : 3"
    />

    <TextInput
      v-else
      v-model="text"
      :type="props.type === 'NUMBER' ? 'number' : props.type === 'URL' ? 'url' : 'text'"
    />
  </div>
</template>
