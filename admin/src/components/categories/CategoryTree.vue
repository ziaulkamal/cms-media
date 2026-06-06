<!--
  admin/src/components/categories/CategoryTree.vue
  Pohon kategori rekursif dengan drag-and-drop (SortableJS):
  - seret gagang untuk mengubah urutan & jenjang (re-parent antar level)
  - kategori default tak bisa diseret/dihapus (terproteksi)
  - dukung seleksi (checkbox), collapse/expand, edit, hapus
-->
<script setup lang="ts">
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  GripVertical,
  Hash,
  Lock,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import { ref } from 'vue';
import draggable from 'vuedraggable';
import type { Category } from '@/types/cms';

/** Node kategori dengan anak (hasil rakit dari daftar flat). */
export interface CategoryNode extends Category {
  children: CategoryNode[];
}

defineProps<{ nodes: CategoryNode[]; selectedIds: Set<string> }>();
const emit = defineEmits<{
  edit: [category: Category];
  delete: [category: Category];
  toggleSelect: [id: string];
  change: [];
}>();

/** Id node yang sub-kategorinya sedang ditutup (default: terbuka). */
const collapsed = ref<Set<string>>(new Set());

/** Buka/tutup sub-kategori sebuah node. */
function toggle(id: string): void {
  const next = new Set(collapsed.value);
  next.has(id) ? next.delete(id) : next.add(id);
  collapsed.value = next;
}
</script>

<template>
  <draggable
    :list="nodes"
    item-key="id"
    handle=".drag-handle"
    :group="{ name: 'categories' }"
    :animation="160"
    ghost-class="cat-ghost"
    drag-class="cat-drag"
    class="space-y-1"
    @change="emit('change')"
  >
    <template #item="{ element: node }">
      <div class="group/node">
        <div
          class="group border-border/60 bg-surface hover:border-primary/40 flex items-center gap-2 rounded-xl border px-2 py-2 shadow-sm transition-colors"
          :class="selectedIds.has(node.id) ? 'ring-primary border-primary ring-1' : ''"
        >
          <!-- Gagang seret (default terproteksi → ikon gembok statis) -->
          <button
            v-if="!node.isDefault"
            type="button"
            class="drag-handle text-text-subtle hover:text-text-primary hover:bg-bg-subtle flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg active:cursor-grabbing"
            aria-label="Seret untuk menyusun"
          >
            <GripVertical class="h-4 w-4" />
          </button>
          <span
            v-else
            class="text-text-subtle flex size-7 shrink-0 items-center justify-center"
            title="Kategori default tidak dapat dipindah"
          >
            <Lock class="h-3.5 w-3.5" />
          </span>

          <!-- Seleksi -->
          <input
            type="checkbox"
            class="accent-primary size-4 shrink-0 rounded"
            :checked="selectedIds.has(node.id)"
            @change="emit('toggleSelect', node.id)"
          />

          <!-- Toggle anak, atau spacer agar label sejajar -->
          <button
            v-if="node.children.length"
            type="button"
            class="text-text-subtle hover:text-text-primary flex size-5 shrink-0 items-center justify-center rounded"
            :aria-expanded="!collapsed.has(node.id)"
            @click="toggle(node.id)"
          >
            <ChevronRight
              class="h-4 w-4 transition-transform"
              :class="{ 'rotate-90': !collapsed.has(node.id) }"
            />
          </button>
          <span v-else class="w-5 shrink-0" aria-hidden="true" />

          <!-- Ikon: folder (induk) / hash (daun) -->
          <component
            :is="node.children.length ? (collapsed.has(node.id) ? Folder : FolderOpen) : Hash"
            class="h-4 w-4 shrink-0"
            :class="node.children.length ? 'text-primary' : 'text-text-subtle'"
          />

          <!-- Nama + slug -->
          <span class="flex min-w-0 flex-1 items-center gap-2">
            <span
              class="truncate text-sm"
              :class="node.children.length ? 'text-text-primary font-semibold' : 'text-text-primary'"
            >
              {{ node.name }}
            </span>
            <span class="text-text-subtle hidden truncate text-xs sm:inline">/{{ node.slug }}</span>
            <span
              v-if="node.isDefault"
              class="bg-primary-light text-primary shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            >
              Default
            </span>
          </span>

          <!-- Badge jumlah artikel & sub-kategori -->
          <span
            v-if="node.articleCount"
            class="text-text-muted hidden shrink-0 items-center gap-1 text-xs tabular-nums sm:inline-flex"
            :title="`${node.articleCount} artikel`"
          >
            <FileText class="h-3.5 w-3.5" />{{ node.articleCount }}
          </span>
          <span
            v-if="node.children.length"
            class="bg-bg-subtle text-text-muted shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
            :title="`${node.children.length} sub-kategori`"
          >
            {{ node.children.length }}
          </span>

          <!-- Aksi -->
          <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              class="text-text-subtle hover:text-primary hover:bg-bg-subtle rounded-lg p-1.5"
              aria-label="Edit kategori"
              @click="emit('edit', node)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              v-if="!node.isDefault"
              type="button"
              class="text-text-subtle hover:text-danger hover:bg-bg-subtle rounded-lg p-1.5"
              aria-label="Hapus kategori"
              @click="emit('delete', node)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Sub-kategori (rekursif): selalu ada area drop walau kosong -->
        <div
          v-show="!collapsed.has(node.id)"
          class="border-border/70 ml-5 mt-1 border-l pl-3"
          :class="!node.children.length ? 'min-h-[0.5rem]' : ''"
        >
          <CategoryTree
            :nodes="node.children"
            :selected-ids="selectedIds"
            @edit="emit('edit', $event)"
            @delete="emit('delete', $event)"
            @toggle-select="emit('toggleSelect', $event)"
            @change="emit('change')"
          />
          <p
            v-if="!node.children.length"
            class="text-text-subtle pointer-events-none px-2 py-0.5 text-xs italic opacity-0 transition group-hover/node:opacity-100"
          >
            Tarik ke sini untuk menjadikannya sub-kategori
          </p>
        </div>
      </div>
    </template>
  </draggable>
</template>

<style scoped>
.cat-ghost {
  opacity: 0.5;
}
.cat-ghost > div:first-child {
  border-style: dashed;
}
</style>
