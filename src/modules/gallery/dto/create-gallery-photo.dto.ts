/**
 * src/modules/gallery/dto/create-gallery-photo.dto.ts
 * Kontrak buat foto galeri (admin); foto merujuk Media yang sudah diunggah.
 */
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PhotoOrientation } from '@prisma/client';

/** Field untuk mendaftarkan foto galeri dari aset Media. */
export class CreateGalleryPhotoDto {
  @IsUUID()
  mediaId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  /** Orientasi; bila kosong diturunkan otomatis dari dimensi media. */
  @IsOptional()
  @IsEnum(PhotoOrientation)
  orientation?: PhotoOrientation;

  @IsOptional()
  @IsUUID()
  albumId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
