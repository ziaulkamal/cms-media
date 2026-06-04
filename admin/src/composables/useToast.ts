/** admin/src/composables/useToast.ts — store toast global (singleton) + helper per tipe. */
import { reactive, readonly } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Satu notifikasi toast yang sedang tampil. */
export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

let nextId = 0;
const state = reactive<{ toasts: Toast[] }>({ toasts: [] });

/** Tambah toast; auto-remove setelah duration (>0). */
function add(type: ToastType, message: string, duration = 4000): number {
  const id = ++nextId;
  state.toasts.push({ id, type, message, duration });
  if (duration > 0) setTimeout(() => remove(id), duration);
  return id;
}

/** Hapus toast berdasarkan id. */
function remove(id: number): void {
  const idx = state.toasts.findIndex((t) => t.id === id);
  if (idx !== -1) state.toasts.splice(idx, 1);
}

/** API toast yang dipakai komponen/store. */
export function useToast() {
  return {
    toasts: readonly(state.toasts),
    success: (m: string) => add('success', m),
    error: (m: string) => add('error', m),
    warning: (m: string) => add('warning', m),
    info: (m: string) => add('info', m),
    dismiss: remove,
  };
}
