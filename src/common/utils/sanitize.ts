/**
 * src/common/utils/sanitize.ts
 * Sanitasi teks bebas dari input publik (komentar, pesan kontak) — anti-XSS.
 */

/**
 * Bersihkan teks: buang tag HTML & karakter kontrol (kecuali tab/newline/CR),
 * lalu rapikan spasi tepi. Dipakai pada konten publik yang dirender di FE.
 */
export function sanitizeText(input: string): string {
  const noTags = input.replace(/<[^>]*>/g, '');
  let out = '';
  for (const ch of noTags) {
    const code = ch.charCodeAt(0);
    const isControl = code < 32 && code !== 9 && code !== 10 && code !== 13;
    if (!isControl) out += ch;
  }
  return out.trim();
}
