<!-- admin/src/components/articles/BlockEditor.vue — editor TipTap; body artikel sebagai dokumen JSON + gambar inline. -->
<script setup lang="ts">
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { PageBreak } from './pageBreak';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  ScissorsLineDashed,
  SquareCode,
  Strikethrough,
  Undo2,
} from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Editor } from '@tiptap/core';

const props = defineProps<{
  modelValue: Record<string, unknown> | null;
  /** Handler unggah gambar inline; kembalikan { url, alt } atau null. Bila ada → tombol gambar tampil. */
  uploadImage?: (file: File) => Promise<{ url: string; alt?: string | null } | null>;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: Record<string, unknown>] }>();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

// Statistik konten: jumlah kata & estimasi waktu baca (≈200 kata/menit).
const wordCount = ref(0);
const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)));
function recountWords(ed: Editor): void {
  const text = ed.getText().trim();
  wordCount.value = text ? text.split(/\s+/).length : 0;
}

const editor = useEditor({
  content: props.modelValue ?? { type: 'doc', content: [] },
  extensions: [StarterKit, Image.configure({ inline: false }), PageBreak],
  editorProps: {
    attributes: { class: 'prose-editor focus:outline-none min-h-[280px]' },
  },
  onCreate: ({ editor }) => recountWords(editor),
  onUpdate: ({ editor }) => {
    recountWords(editor);
    emit('update:modelValue', editor.getJSON() as Record<string, unknown>);
  },
});

/** Unggah berkas terpilih lalu sisipkan sebagai node gambar. */
async function onImageSelected(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !props.uploadImage) return;
  uploading.value = true;
  try {
    const result = await props.uploadImage(file);
    if (result) {
      editor.value
        ?.chain()
        .focus()
        .setImage({ src: result.url, alt: result.alt ?? undefined })
        .run();
    }
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

// Sinkronkan konten eksternal (mis. saat artikel termuat di mode edit).
watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value || !value) return;
    const current = JSON.stringify(editor.value.getJSON());
    if (JSON.stringify(value) !== current) {
      editor.value.commands.setContent(value, false);
      recountWords(editor.value);
    }
  },
);

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="border-border bg-surface rounded-md border">
    <div v-if="editor" class="border-border flex flex-wrap items-center gap-1 border-b p-2">
      <template
        v-for="(group, gi) in [
          [
            { icon: Bold, action: () => editor!.chain().focus().toggleBold().run(), active: editor.isActive('bold'), disabled: false, label: 'Tebal' },
            { icon: Italic, action: () => editor!.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), disabled: false, label: 'Miring' },
            { icon: Strikethrough, action: () => editor!.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), disabled: false, label: 'Coret' },
            { icon: Code, action: () => editor!.chain().focus().toggleCode().run(), active: editor.isActive('code'), disabled: false, label: 'Kode sebaris' },
          ],
          [
            { icon: Heading1, action: () => editor!.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), disabled: false, label: 'Judul 1' },
            { icon: Heading2, action: () => editor!.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), disabled: false, label: 'Judul 2' },
            { icon: Heading3, action: () => editor!.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), disabled: false, label: 'Judul 3' },
          ],
          [
            { icon: List, action: () => editor!.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), disabled: false, label: 'Daftar' },
            { icon: ListOrdered, action: () => editor!.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), disabled: false, label: 'Daftar nomor' },
            { icon: Quote, action: () => editor!.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), disabled: false, label: 'Kutipan' },
            { icon: SquareCode, action: () => editor!.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock'), disabled: false, label: 'Blok kode' },
            { icon: Minus, action: () => editor!.chain().focus().setHorizontalRule().run(), active: false, disabled: false, label: 'Garis pemisah' },
            { icon: ScissorsLineDashed, action: () => editor!.chain().focus().setPageBreak().run(), active: false, disabled: false, label: 'Batas halaman' },
          ],
          [
            { icon: Undo2, action: () => editor!.chain().focus().undo().run(), active: false, disabled: !editor.can().undo(), label: 'Urungkan' },
            { icon: Redo2, action: () => editor!.chain().focus().redo().run(), active: false, disabled: !editor.can().redo(), label: 'Ulangi' },
          ],
        ]"
        :key="gi"
      >
        <span v-if="gi > 0" class="bg-border mx-1 h-5 w-px" />
        <button
          v-for="btn in group"
          :key="btn.label"
          type="button"
          :title="btn.label"
          :aria-label="btn.label"
          :disabled="btn.disabled"
          class="rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          :class="btn.active ? 'bg-primary-light text-primary' : 'text-text-muted hover:bg-bg-subtle'"
          @click="btn.action"
        >
          <component :is="btn.icon" class="h-4 w-4" />
        </button>
      </template>

      <!-- Sisip gambar (hanya bila uploadImage tersedia) -->
      <template v-if="uploadImage">
        <span class="bg-border mx-1 h-5 w-px" />
        <button
          type="button"
          title="Sisipkan gambar"
          aria-label="Sisipkan gambar"
          class="text-text-muted hover:bg-bg-subtle rounded p-1.5 transition-colors disabled:opacity-50"
          :disabled="uploading"
          @click="fileInput?.click()"
        >
          <ImagePlus class="h-4 w-4" />
        </button>
        <span v-if="uploading" class="text-text-subtle text-xs">Mengunggah…</span>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onImageSelected" />
      </template>
    </div>
    <EditorContent :editor="editor" class="px-4 py-3 text-sm" />

    <div
      v-if="editor"
      class="border-border text-text-subtle flex items-center justify-end gap-3 border-t px-4 py-1.5 text-xs"
    >
      <span>{{ wordCount }} kata</span>
      <span class="bg-border h-3 w-px" />
      <span>± {{ readingMinutes }} mnt baca</span>
    </div>
  </div>
</template>

<style scoped>
:deep(.prose-editor) {
  line-height: 1.7;
}
:deep(.prose-editor h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.9rem 0 0.5rem;
}
:deep(.prose-editor h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem;
}
:deep(.prose-editor h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.65rem 0 0.4rem;
}
:deep(.prose-editor ul) {
  list-style: disc;
  padding-left: 1.25rem;
}
:deep(.prose-editor ol) {
  list-style: decimal;
  padding-left: 1.25rem;
}
:deep(.prose-editor blockquote) {
  border-left: 3px solid var(--color-border-strong);
  padding-left: 0.75rem;
  color: var(--color-text-muted);
}
:deep(.prose-editor p) {
  margin: 0.4rem 0;
}
:deep(.prose-editor img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  margin: 0.5rem 0;
}
:deep(.prose-editor code) {
  background-color: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  padding: 0.1rem 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.875em;
}
:deep(.prose-editor pre) {
  background-color: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  overflow-x: auto;
}
:deep(.prose-editor pre code) {
  background-color: transparent;
  padding: 0;
}
:deep(.prose-editor hr) {
  border: none;
  border-top: 1px solid var(--color-border-strong);
  margin: 1rem 0;
}
:deep(.prose-editor .page-break) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
  border-top: 2px dashed var(--color-primary);
  user-select: none;
}
:deep(.prose-editor .page-break span) {
  transform: translateY(-0.7em);
  background-color: var(--color-surface);
  padding: 0 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary);
}
:deep(.prose-editor .page-break.ProseMirror-selectednode) {
  border-top-color: var(--color-primary-hover);
}
</style>
