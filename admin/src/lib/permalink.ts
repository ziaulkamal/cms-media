/**
 * admin/src/lib/permalink.ts
 * Slugify (cermin backend) + perakit permalink dari struktur bertoken gaya WordPress.
 * Token: %postname% %pagename% %category% %year% %monthnum% %day% %id%
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

const pad = (n: number): string => String(n).padStart(2, '0');

/** Token yang bisa dipakai pada struktur permalink (untuk bantuan UI). */
export const PERMALINK_TOKENS = [
  '%postname%',
  '%pagename%',
  '%category%',
  '%year%',
  '%monthnum%',
  '%day%',
  '%id%',
] as const;

export interface PermalinkTokens {
  slug: string;
  category?: string;
  date?: Date;
  id?: string;
}

/** Rakit path permalink dari struktur + token; normalisasi slash. */
export function buildPermalink(
  structure: string,
  { slug, category, date = new Date(), id = '' }: PermalinkTokens,
): string {
  const replaced = (structure || '/%postname%')
    .replace(/%postname%/g, slug)
    .replace(/%pagename%/g, slug)
    .replace(/%category%/g, category || 'uncategorized')
    .replace(/%year%/g, String(date.getFullYear()))
    .replace(/%monthnum%/g, pad(date.getMonth() + 1))
    .replace(/%day%/g, pad(date.getDate()))
    .replace(/%id%/g, id);
  // Buang segmen kosong (slash ganda / token kosong) lalu pastikan leading slash.
  return '/' + replaced.split('/').filter(Boolean).join('/');
}
