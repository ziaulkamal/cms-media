/** admin/src/lib/format.ts — helper format murni (tanggal, ukuran berkas). */
import dayjs from 'dayjs';

/** Format tanggal ISO -> "DD MMM YYYY" (atau dengan jam bila withTime). */
export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return '—';
  return dayjs(value).format(withTime ? 'DD MMM YYYY HH:mm' : 'DD MMM YYYY');
}

/** Format byte -> ukuran manusiawi (KB/MB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
