/**
 * admin/src/lib/permalink.ts
 * Slugify (cermin backend) untuk pratinjau tautan FE.
 */

/** Ubah teks bebas menjadi slug URL-safe (sinkron dengan src/common/utils/slug.ts). */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
