/**
 * src/common/utils/youtube.ts
 * Ekstraksi YouTube video id dari URL tempel (watch/youtu.be/embed/live/shorts).
 */

/** Ambil 11 karakter id valid pertama, atau null bila tak cocok. */
function clean(candidate: string): string | null {
  const m = candidate.match(/[\w-]{11}/);
  return m ? m[0] : null;
}

/**
 * Kembalikan YouTube video id dari input (URL atau id mentah), atau null.
 * Mendukung youtu.be, watch?v=, /embed/, /live/, /shorts/.
 */
export function extractYoutubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;

  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return clean(url.pathname.slice(1));
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = url.searchParams.get('v');
      if (v) return clean(v);
      const m = url.pathname.match(/\/(?:embed|live|shorts)\/([\w-]{11})/);
      if (m) return clean(m[1]);
    }
  } catch {
    // Bukan URL valid; jatuh ke null.
  }
  return null;
}
