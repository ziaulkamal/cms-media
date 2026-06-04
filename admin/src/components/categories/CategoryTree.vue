<!-- admin/src/components/categories/CategoryTree.vue — render hierarki kategori (rekursif): toggle, ikon, badge jumlah anak, aksi. -->
<script setup lang="ts">
import { ChevronRight, Folder, FolderOpen, Hash, Pencil, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';
import type { Category } from '@/types/cms';

/** Node kategori dengan anak (hasil rakit dari daftar flat). */
export interface CategoryNode extends Category {
  children: CategoryNode[];
}

defineProps<{ nodes: CategoryNode[] }>();
const emit = defineEmits<{ edit: [category: Category]; delete: [category: Category] }>();

/** Id node yang sub-kategorinya sedang ditutup (default: terbuka). */
const collapsed = ref<Set<string>>(new Set());

/** Buka/tutup sub-kategori sebuah node. */
function toggle(id: string): void {
  const next = new Set(collapsed.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  collapsed.value = next;
}
</script>

<template>
  <ul class="space-y-0.5">
    <li v-for="node in nodes" :key="node.id">
      <div
        class="group hover:bg-bg-subtle flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
      >
        <!-- Toggle sub-kategori, atau spacer agar label tetap sejajar -->
        <button
          v-if="node.children.length"
          type="button"
          class="text-text-subtle hover:text-text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded"
          :aria-label="collapsed.has(node.id) ? 'Buka sub-kategori' : 'Tutup sub-kategori'"
          :aria-expanded="!collapsed.has(node.id)"
          @click="toggle(node.id)"
        >
          <ChevronRight
            class="h-4 w-4 transition-transform"
            :class="{ 'rotate-90': !collapsed.has(node.id) }"
          />
        </button>
        <span v-else class="w-5 shrink-0" aria-hidden="true" />

        <!-- Ikon: folder untuk induk, hash untuk rubrik daun -->
        <component
          :is="node.children.length ? (collapsed.has(node.id) ? Folder : FolderOpen) : Hash"
          class="h-4 w-4 shrink-0"
          :class="node.children.length ? 'text-primary' : 'text-text-subtle'"
        />

        <span
          class="min-w-0 flex-1 truncate text-sm"
          :class="node.children.length ? 'text-text-primary font-medium' : 'text-text-muted'"
        >
          {{ node.name }}
        </span>

        <!-- Jumlah sub-kategori -->
        <span
          v-if="node.children.length"
          class="bg-bg-subtle text-text-muted group-hover:bg-surface shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
        >
          {{ node.children.length }}
        </span>

        <!-- Aksi (muncul saat hover / fokus keyboard) -->
        <div
          class="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100"
        >
          <button
            type="button"
            class="text-text-subtle hover:text-primary hover:bg-surface rounded p-1"
            aria-label="Edit kategori"
            @click="emit('edit', node)"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="text-text-subtle hover:text-danger hover:bg-surface rounded p-1"
            aria-label="Hapus kategori"
            @click="emit('delete', node)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Sub-kategori (rekursif) dengan garis panduan indentasi -->
      <div
        v-if="node.children.length && !collapsed.has(node.id)"
        class="border-border ml-3.5 border-l pl-2.5"
      >
        <CategoryTree
          :nodes="node.children"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </li>
  </ul>
</template>
