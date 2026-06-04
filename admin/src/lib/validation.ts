/** admin/src/lib/validation.ts — petakan error.details backend ke error per-field form. */

/**
 * Backend mengirim details berupa array pesan class-validator yang lazimnya
 * diawali nama field (mis. "title must be longer..."). Ambil pesan pertama per field.
 */
export function parseFieldErrors(details: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (Array.isArray(details)) {
    for (const message of details) {
      if (typeof message === 'string') {
        const field = message.split(' ')[0];
        if (field && !result[field]) result[field] = message;
      }
    }
  }
  return result;
}
