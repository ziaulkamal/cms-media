/**
 * admin/src/composables/useConfirm.ts
 * Dialog konfirmasi imperatif berbasis Promise (ganti window.confirm).
 * Dipakai: `if (await confirm({ message })) { ... }`. Render via <ConfirmDialog/>.
 */
import { reactive } from 'vue';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Aksi destruktif → tombol konfirmasi merah. */
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

const state = reactive<ConfirmState>({ open: false, message: '', resolve: null });

export function useConfirm() {
  /** Tampilkan dialog; resolve true bila dikonfirmasi, false bila dibatalkan. */
  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      state.title = options.title;
      state.message = options.message;
      state.confirmText = options.confirmText;
      state.cancelText = options.cancelText;
      state.danger = options.danger;
      state.open = true;
      state.resolve = resolve;
    });
  }

  /** Tutup dialog & teruskan jawaban ke pemanggil. */
  function respond(value: boolean): void {
    state.open = false;
    state.resolve?.(value);
    state.resolve = null;
  }

  return { state, confirm, respond };
}
