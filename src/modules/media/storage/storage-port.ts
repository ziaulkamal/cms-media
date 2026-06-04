/**
 * src/modules/media/storage/storage-port.ts
 * Kontrak penyimpanan file (port); implementasi konkret di-inject (local/S3).
 */

/** Token DI untuk StoragePort. */
export const STORAGE_PORT = Symbol('STORAGE_PORT');

/** Berkas yang akan disimpan. */
export interface StorageFile {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

/** Abstraksi penyimpanan: simpan, hapus, dan bangun URL publik berdasar key. */
export interface StoragePort {
  /** Simpan berkas dan kembalikan storage key uniknya. */
  save(file: StorageFile): Promise<string>;
  /** Hapus berkas berdasarkan key (abaikan bila tak ada). */
  delete(key: string): Promise<void>;
  /** URL publik untuk sebuah key. */
  publicUrl(key: string): string;
}
