/**
 * src/common/utils/duration.ts
 * Konversi string TTL gaya JWT ("900s", "15m", "7d") ke milidetik.
 */

const UNIT_TO_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Parse TTL ("900s"/"15m"/"2h"/"7d"); angka polos dianggap detik. */
export function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])?$/.exec(ttl.trim());
  if (!match) throw new Error(`Format TTL tidak valid: ${ttl}`);
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  return value * UNIT_TO_MS[unit];
}
