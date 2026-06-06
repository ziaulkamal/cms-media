<!--
  admin/src/components/branding/LogoUploader.vue
  Pengunggah gambar tunggal (logo/favicon): preview + unggah/ganti + hapus.
  Mengunggah ke modul Media lalu menyimpan URL hasil sebagai v-model (string).
-->
<script setup lang="ts">
import { ref } from 'vue';
import { ImageOff, Trash2, Upload } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import { mediaApi } from '@/api/media';
import Button from '@/components/ui/Button.vue';
import { useToast } from '@/composables/useToast';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    hint?: string;
    /** Latar preview gelap (untuk logo versi dark/footer). */
    dark?: boolean;
  }>(),
  { hint: '', dark: false },
);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const toast = useToast();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

function pick(): void {
  fileInput.value?.click();
}

async function onChange(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const media = await mediaApi.upload(file, props.label);
    emit('update:modelValue', media.url);
    toast.success('Gambar diunggah.');
  } catch (err) {
    toast.error(err instanceof ApiError ? err.message : 'Gagal mengunggah.');
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-text-primary text-sm font-medium">{{ label }}</span>
    <div class="flex items-center gap-3">
      <!-- Preview -->
      <div
        class="border-border flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
        :class="dark ? 'bg-slate-800' : 'bg-bg-subtle'"
        style="background-image: linear-gradient(45deg, rgba(127,127,127,0.12) 25%, transparent 25%, transparent 75%, rgba(127,127,127,0.12) 75%), linear-gradient(45deg, rgba(127,127,127,0.12) 25%, transparent 25%, transparent 75%, rgba(127,127,127,0.12) 75%); background-size: 14px 14px; background-position: 0 0, 7px 7px;"
      >
        <img v-if="modelValue" :src="modelValue" :alt="label" class="max-h-full max-w-full object-contain" />
        <ImageOff v-else class="text-text-subtle h-6 w-6" />
      </div>

      <div class="flex min-w-0 flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <Button size="sm" variant="secondary" :loading="uploading" @click="pick">
            <Upload class="h-4 w-4" /> {{ modelValue ? 'Ganti' : 'Unggah' }}
          </Button>
          <Button
            v-if="modelValue"
            size="sm"
            variant="ghost"
            @click="emit('update:modelValue', '')"
          >
            <Trash2 class="h-4 w-4" /> Hapus
          </Button>
        </div>
        <p v-if="hint" class="text-text-subtle text-xs">{{ hint }}</p>
      </div>
    </div>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onChange" />
  </div>
</template>
