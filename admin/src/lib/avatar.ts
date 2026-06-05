/**
 * admin/src/lib/avatar.ts
 * Helper avatar murni: inisial nama untuk fallback avatar berbasis huruf.
 */

/** Ambil maksimal 2 inisial dari nama (huruf depan tiap kata), uppercase. */
export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const out = parts.map((w) => w.charAt(0).toUpperCase()).join('');
  return out || '?';
}
