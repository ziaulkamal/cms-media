/** admin/src/composables/useSelection.ts — state seleksi baris untuk aksi massal. */
import { computed, ref } from 'vue';

/** Kelola himpunan id terpilih: toggle, pilih-semua, bersihkan. */
export function useSelection() {
  const selected = ref<Set<string>>(new Set());

  const ids = computed(() => [...selected.value]);
  const count = computed(() => selected.value.size);
  const has = (id: string) => selected.value.has(id);

  function toggle(id: string): void {
    const next = new Set(selected.value);
    next.has(id) ? next.delete(id) : next.add(id);
    selected.value = next;
  }

  /** Tambah/buang sekumpulan id (mis. pilih-semua di halaman). */
  function setMany(targetIds: string[], on: boolean): void {
    const next = new Set(selected.value);
    for (const id of targetIds) on ? next.add(id) : next.delete(id);
    selected.value = next;
  }

  function clear(): void {
    selected.value = new Set();
  }

  const allSelected = (targetIds: string[]) =>
    targetIds.length > 0 && targetIds.every((id) => selected.value.has(id));

  return { selected, ids, count, has, toggle, setMany, clear, allSelected };
}
