/**
 * src/modules/venue-content/dto/upsert-venue-content.dto.ts
 * Kontrak kelola pengayaan venue (upsert by venueRef).
 */
import {
  IsArray,
  IsBoolean,
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

  /** Opsional — admin cukup memberi foto; data inti venue dari simpora2026. */
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  /** undefined = foto utama tak diubah; null = lepas foto; uuid = ganti foto. */
  @IsOptional()
  @IsUUID()
  imageMediaId?: string | null;

  /** Galeri tambahan (array id/url media); disimpan apa adanya sebagai JSON. */
  @IsOptional()
  @IsArray()
  gallery?: unknown[];

  /** Tampilkan galeri di WEB (default true). */
  @IsOptional()
  @IsBoolean()
  galleryVisible?: boolean;
}
