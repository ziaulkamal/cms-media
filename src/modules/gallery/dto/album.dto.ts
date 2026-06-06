/**
 * src/modules/gallery/dto/album.dto.ts
 * Kontrak buat & ubah album galeri.
 */
import { PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field untuk membuat album galeri. */
export class CreateAlbumDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;
}

/** Field ubah album (semua opsional). */
export class UpdateAlbumDto extends PartialType(CreateAlbumDto) {}
