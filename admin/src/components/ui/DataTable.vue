<!-- admin/src/components/ui/DataTable.vue — tabel data generik berbasis kolom + slot sel kustom, sort & grouping opsional. -->
<script setup lang="ts" generic="T extends object">
import { computed } from 'vue';
import { ChevronsUpDown, Layers } from 'lucide-vue-next';

export interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  class?: string;
  /** Kolom bisa diklik untuk sort/grouping. */
  sortable?: boolean;
}

const props = defineProps<{
  columns: ReadonlyArray<Column>;
  rows: ReadonlyArray<T>;
  rowKey: (row: T) => string;
  /** Kelas tambahan per baris (mis. untuk menandai baris terpilih). */
  rowClass?: (row: T) => string;
  /** Label grup per baris; bila diset, baris dengan label sama (berurutan) diberi header grup. */
  groupBy?: (row: T) => string | null;
  /** Key kolom yang sedang aktif sort/group (untuk indikator header). */
  activeSort?: string | null;
}>();

const emit = defineEmits<{ sort: [key: string] }>();

const alignClass: Record<NonNullable<Column['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/** Label grup baris ke-i (null bila grouping mati). */
function groupOf(i: number): string | null {
  return props.groupBy ? props.groupBy(props.rows[i]) : null;
}
/** True bila baris ke-i memulai grup baru → render header grup. */
function isGroupStart(i: number): boolean {
  const g = groupOf(i);
  if (g == null) return false;
  return i === 0 || groupOf(i - 1) !== g;
}
/** Jumlah baris per label grup (untuk ditampilkan di header grup). */
const groupCounts = computed(() => {
  const m = new Map<string, number>();
  if (props.groupBy) {
    for (const r of props.rows) {
      const g = props.groupBy(r);
      if (g != null) m.set(g, (m.get(g) ?? 0) + 1);
    }
  }
  return m;
});
</script>

<template>
  <div class="border-border overflow-x-auto rounded-lg border">
    <table class="w-full border-collapse text-sm">
      <thead class="bg-bg-subtle">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="text-text-muted px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
            :class="[alignClass[col.align ?? 'left'], col.class]"
          >
            <button
              v-if="col.sortable"
              type="button"
              class="hover:text-text-primary inline-flex items-center gap-1 transition-colors"
              :class="activeSort === col.key ? 'text-primary' : ''"
              @click="emit('sort', col.key)"
            >
              <slot :name="`head-${col.key}`">{{ col.label }}</slot>
              <component
                :is="activeSort === col.key ? Layers : ChevronsUpDown"
                class="h-3.5 w-3.5"
                :class="activeSort === col.key ? 'text-primary' : 'text-text-subtle'"
              />
            </button>
            <slot v-else :name="`head-${col.key}`">{{ col.label }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(row, i) in rows" :key="rowKey(row)">
          <tr v-if="isGroupStart(i)" class="bg-bg-subtle/50 border-border border-t">
            <td
              :colspan="columns.length"
              class="text-text-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide"
            >
              <slot name="group-header" :label="groupOf(i)" :count="groupCounts.get(groupOf(i) ?? '')">
                {{ groupOf(i) }}
                <span class="text-text-subtle font-normal normal-case">
                  · {{ groupCounts.get(groupOf(i) ?? '') }}
                </span>
              </slot>
            </td>
          </tr>
          <tr
            class="border-border hover:bg-bg-subtle/60 border-t transition-colors"
            :class="rowClass?.(row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="text-text-primary px-4 py-3"
              :class="[alignClass[col.align ?? 'left'], col.class]"
            >
              <slot :name="`cell-${col.key}`" :row="row">
                {{ (row as Record<string, unknown>)[col.key] ?? '' }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
