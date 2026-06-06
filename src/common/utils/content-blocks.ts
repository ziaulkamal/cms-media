/**
 * src/common/utils/content-blocks.ts
 * Transform body artikel (TipTap doc / format lain) menjadi blok konsumsi FE PORA.
 */

/** Blok konten ternormalisasi yang dirender FE: paragraf, subjudul, atau kutipan. */
export interface ContentBlock {
  tipe: 'paragraf' | 'subjudul' | 'kutipan';
  teks: string;
}

/** Pemetaan tipe node TipTap -> tipe blok FE. */
const NODE_TO_TIPE: Record<string, ContentBlock['tipe']> = {
  paragraph: 'paragraf',
  heading: 'subjudul',
  blockquote: 'kutipan',
};

/** Rangkai teks dari node TipTap secara rekursif (gabungkan semua text leaf). */
function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as { text?: unknown; content?: unknown };
  if (typeof n.text === 'string') return n.text;
  if (Array.isArray(n.content)) return n.content.map(extractText).join('');
  return '';
}

/** Apakah nilai sudah berbentuk blok FE ({ tipe, teks }). */
function isContentBlock(v: unknown): v is ContentBlock {
  if (!v || typeof v !== 'object') return false;
  const b = v as Record<string, unknown>;
  return (
    (b.tipe === 'paragraf' || b.tipe === 'subjudul' || b.tipe === 'kutipan') &&
    typeof b.teks === 'string'
  );
}

/**
 * Ubah body artikel ke array blok FE.
 * Menerima dokumen TipTap ({ type:'doc', content:[...] }) maupun array blok yang sudah jadi.
 */
export function toContentBlocks(body: unknown): ContentBlock[] {
  // Sudah array: lewatkan blok valid, abaikan sisanya.
  if (Array.isArray(body)) {
    return body.filter(isContentBlock);
  }

  if (body && typeof body === 'object') {
    const doc = body as { content?: unknown };
    if (Array.isArray(doc.content)) {
      const blocks: ContentBlock[] = [];
      for (const node of doc.content) {
        if (!node || typeof node !== 'object') continue;
        const type = (node as { type?: unknown }).type;
        const tipe = typeof type === 'string' ? NODE_TO_TIPE[type] : undefined;
        if (!tipe) continue;
        const teks = extractText(node).trim();
        if (teks) blocks.push({ tipe, teks });
      }
      return blocks;
    }
  }

  return [];
}
