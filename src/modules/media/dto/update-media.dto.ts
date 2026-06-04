/**
 * src/modules/media/dto/update-media.dto.ts
 * Kontrak perubahan metadata media (judul, deskripsi, alt) — untuk SEO.
 */
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Field metadata media yang boleh diubah. */
export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  alt?: string;
}
