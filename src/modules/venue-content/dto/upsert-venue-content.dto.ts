/**
 * src/modules/venue-content/dto/upsert-venue-content.dto.ts
 * Kontrak kelola pengayaan venue (upsert by venueRef).
 */
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field deskripsi + foto pengayaan untuk satu venue simpora2026. */
export class UpsertVenueContentDto {
  /** Id/slug venue di simpora2026 (kunci unik konten). */
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  venueRef!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @IsUUID()
  imageMediaId?: string;

  /** Galeri tambahan (array id/url media); disimpan apa adanya sebagai JSON. */
  @IsOptional()
  @IsArray()
  gallery?: unknown[];
}
