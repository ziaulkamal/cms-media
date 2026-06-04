/**
 * src/modules/articles/dto/publish-article.dto.ts
 * Kontrak publish: tanpa tanggal = terbit sekarang; tanggal masa depan = terjadwal.
 */
import { IsISO8601, IsOptional } from 'class-validator';

/** Opsi publish artikel. */
export class PublishArticleDto {
  /** Waktu terbit (ISO-8601). Kosong = sekarang; masa depan = SCHEDULED. */
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
}
