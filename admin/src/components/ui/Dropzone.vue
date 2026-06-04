<!-- admin/src/components/ui/Dropzone.vue — area seret & lepas / klik untuk pilih berkas. -->
<script setup lang="ts">
import { UploadCloud } from 'lucide-vue-next';
import { ref } from 'vue';

withDefaults(
  defineProps<{ accept?: string; multiple?: boolean; busy?: boolean }>(),
  { accept: 'image/*', multiple: true },
);
const emit = defineEmits<{ files: [files: File[]] }>();

const input = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);

function emitFiles(list: FileList | null): void {
  if (!list || list.length === 0) return;
  emit('files', Array.from(list));
}

function onDrop(event: DragEvent): void {
  dragOver.value = false;
  emitFiles(event.dataTransfer?.files ?? null);
}

function onChange(event: Event): void {
  emitFiles((event.target as HTMLInputElement).files);
  if (input.value) input.value.value = '';
}
</script>

<template>
  <div
    class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors"
    :class="dragOver ? 'border-primary bg-primary-light' : 'border-border hover:border-primary'"
    role="button"
    tabindex="0"
    @click="input?.click()"
    @keydown.enter="input?.click()"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="onDrop"
  >
    <UploadCloud class="text-text-subtle h-8 w-8" :class="busy ? 'animate-pulse' : ''" />
    <p class="text-text-primary text-sm font-medium">
      {{ busy ? 'Mengunggah…' : 'Seret & lepas gambar di sini' }}
    </p>
    <p class="text-text-subtle text-xs">atau klik untuk memilih berkas</p>
    <input
      ref="input"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      @change="onChange"
    />
  </div>
</template>
