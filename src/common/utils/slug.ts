/**
 * src/common/utils/slug.ts
 * Util pembuat slug URL-safe dari teks bebas (dipakai artikel, kategori, tag).
 */

/** Ubah teks menjadi slug: lowercase, tanpa diakritik, dipisah tanda hubung. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
