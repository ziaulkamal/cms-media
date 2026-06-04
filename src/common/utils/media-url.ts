/**
 * src/common/utils/media-url.ts
 * Sumber tunggal pembuatan URL publik media dari storage key (dipakai Media & Article).
 */

/** Bangun URL publik penuh untuk sebuah storage key media. */
export function mediaPublicUrl(key: string): string {
  const base = (
    process.env.STORAGE_PUBLIC_BASE_URL ?? 'http://localhost:3000/uploads'
  ).replace(/\/+$/, '');
  return `${base}/${key.replace(/^\/+/, '')}`;
}
