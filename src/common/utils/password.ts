/**
 * src/common/utils/password.ts
 * Pembuat password acak aman (CSPRNG) untuk reset oleh admin.
 */
import { randomInt } from 'crypto';

/** Alfabet tanpa karakter ambigu (0/O, 1/l/I) agar mudah dibacakan ke user. */
const ALPHABET =
  'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Buat password acak sepanjang `length` memakai randomInt (tanpa bias modulo). */
export function generatePassword(length = 14): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}
