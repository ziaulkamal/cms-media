<!-- admin/src/components/ui/TagInput.vue — input chip: ketik lalu koma/Enter mengubah teks jadi chip terpisah. -->
<script setup lang="ts">
import { ref, useId } from 'vue';
import { X } from 'lucide-vue-next';

const model = defineModel<string[]>({ default: () => [] });

defineProps<{
  label?: string;
  placeholder?: string;
  error?: string;
}>();

const draft = ref('');
const fieldRef = ref<HTMLInputElement | null>(null);
const id = useId();

/** Tambah satu/lebih chip dari teks (dipecah koma); buang kosong & duplikat (case-insensitive). */
function add(raw: string): void {
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return;
  const next = [...model.value];
  for (const p of parts) {
    if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
  }
  model.value = next;
}

function commitDraft(): void {
  if (!draft.value.trim()) return;
  add(draft.value);
  draft.value = '';
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    commitDraft();
  } else if (e.key === 'Backspace' && !draft.value && model.value.length) {
    model.value = model.value.slice(0, -1);
  }
}

/** Tempel teks berisi koma → langsung pecah jadi beberapa chip. */
function onPaste(e: ClipboardEvent): void {
  const text = e.clipboardData?.getData('text') ?? '';
  if (text.includes(',')) {
    e.preventDefault();
    add(text);
  }
}

function remove(idx: number): void {
  model.value = model.value.filter((_, i) => i !== idx);
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-text-primary text-sm font-medium">{{ label }}</label>
    <div
      class="border-border bg-surface focus-within:border-primary flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5"
      :class="error ? 'border-danger' : ''"
      @click="fieldRef?.focus()"
    >
      <span
        v-for="(chip, idx) in model"
        :key="`${chip}-${idx}`"
        class="bg-primary-light text-primary inline-flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs font-medium"
      >
        {{ chip }}
        <button
          type="button"
          class="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
          :aria-label="`Hapus ${chip}`"
          @click.stop="remove(idx)"
        >
          <X class="h-3 w-3" />
        </button>
      </span>
      <input
        :id="id"
        ref="fieldRef"
        v-model="draft"
        :placeholder="model.length ? '' : placeholder"
        class="text-text-primary placeholder:text-text-subtle min-w-[6rem] flex-1 bg-transparent py-0.5 text-sm outline-none"
        @keydown="onKeydown"
        @paste="onPaste"
        @blur="commitDraft"
      />
    </div>
    <p v-if="error" class="text-danger text-xs">{{ error }}</p>
  </div>
</template>
