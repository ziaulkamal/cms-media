/**
 * src/common/dto/bulk-ids.dto.ts
 * Kontrak aksi massal berdasar daftar id (mis. hapus banyak sekaligus).
 */
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

/** Daftar id target aksi massal (maksimum 200 per permintaan). */
export class BulkIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  ids!: string[];
}
