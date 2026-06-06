<!--
  admin/src/components/menus/MenuTree.vue
  Pohon menu draggable (SortableJS). Mode:
  - datar (nested=false): satu level (Main / Bawah Footer)
  - berjenjang (nested=true): 2 level kolom -> item (Footer)
  Emit: edit, delete, toggleVisible, change (setelah drag).
-->
<script setup lang="ts">
import {
  Eye,
  EyeOff,
  GripVertical,
  Link2,
  Hash,
  ExternalLink,
  Columns3,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import draggable from 'vuedraggable';
import type { MenuNode } from '@/types/cms';

withDefaults(
  defineProps<{ nodes: MenuNode[]; nested?: boolean; depth?: number }>(),
  { nested: false, depth: 0 },
);
const emit = defineEmits<{
  edit: [item: MenuNode];
  delete: [item: MenuNode];
  toggleVisible: [item: MenuNode];
  change: [];
}>();

const typeMeta: Record<string, { icon: unknown; label: string }> = {
  ANCHOR: { icon: Hash, label: 'Anchor' },
  ROUTE: { icon: Link2, label: 'Route' },
  EXTERNAL: { icon: ExternalLink, label: 'External' },
};
</script>

<template>
  <draggable
    :list="nodes"
    item-key="id"
    handle=".drag-handle"
    :group="{ name: 'menu' }"
    :animation="160"
    ghost-class="menu-ghost"
    class="space-y-1.5"
    @change="emit('change')"
  >
    <template #item="{ element: node }">
      <div class="group/node">
        <div
          class="group border-border/60 bg-surface hover:border-primary/40 flex items-center gap-2 rounded-xl border px-2 py-2 shadow-sm transition-colors"
          :class="!node.isVisible ? 'opacity-55' : ''"
        >
          <button
            type="button"
            class="drag-handle text-text-subtle hover:text-text-primary hover:bg-bg-subtle flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg active:cursor-grabbing"
            aria-label="Seret untuk menyusun"
          >
            <GripVertical class="h-4 w-4" />
          </button>

          <!-- Ikon konteks: kolom footer vs item link -->
          <component
            :is="nested && depth === 0 && node.url === null ? Columns3 : typeMeta[node.type].icon"
            class="h-4 w-4 shrink-0"
            :class="nested && depth === 0 && node.url === null ? 'text-primary' : 'text-text-subtle'"
          />

          <span class="flex min-w-0 flex-1 items-center gap-2">
            <span
              class="truncate text-sm"
              :class="nested && depth === 0 ? 'text-text-primary font-semibold' : 'text-text-primary'"
            >
              {{ node.label }}
            </span>
            <span v-if="node.url" class="text-text-subtle hidden truncate text-xs sm:inline">
              {{ node.url }}
            </span>
            <span
              v-if="nested && depth === 0 && node.url === null"
              class="bg-primary-light text-primary shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            >
              Kolom
            </span>
            <span
              v-else
              class="bg-bg-subtle text-text-muted shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
            >
              {{ typeMeta[node.type].label }}
            </span>
            <span
              v-if="node.openInNewTab"
              class="text-text-subtle hidden items-center gap-0.5 text-[11px] sm:inline-flex"
              title="Buka di tab baru"
            >
              <ExternalLink class="h-3 w-3" />
            </span>
          </span>

          <!-- Aksi -->
          <div class="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              class="text-text-subtle hover:text-primary hover:bg-bg-subtle rounded-lg p-1.5"
              :aria-label="node.isVisible ? 'Sembunyikan' : 'Tampilkan'"
              :title="node.isVisible ? 'Tampil di WEB' : 'Tersembunyi'"
              @click="emit('toggleVisible', node)"
            >
              <component :is="node.isVisible ? Eye : EyeOff" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="text-text-subtle hover:text-primary hover:bg-bg-subtle rounded-lg p-1.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              aria-label="Edit"
              @click="emit('edit', node)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="text-text-subtle hover:text-danger hover:bg-bg-subtle rounded-lg p-1.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              aria-label="Hapus"
              @click="emit('delete', node)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Anak (hanya footer, level kolom) -->
        <div v-if="nested && depth === 0" class="border-border/70 ml-5 mt-1.5 border-l pl-3">
          <MenuTree
            :nodes="node.children"
            :nested="true"
            :depth="1"
            @edit="emit('edit', $event)"
            @delete="emit('delete', $event)"
            @toggle-visible="emit('toggleVisible', $event)"
            @change="emit('change')"
          />
          <p
            v-if="!node.children.length"
            class="text-text-subtle pointer-events-none px-2 py-0.5 text-xs italic opacity-0 transition group-hover/node:opacity-100"
          >
            Tarik item ke sini untuk masuk kolom ini
          </p>
        </div>
      </div>
    </template>
  </draggable>
</template>

<style scoped>
.menu-ghost {
  opacity: 0.5;
}
.menu-ghost > div:first-child {
  border-style: dashed;
}
</style>
