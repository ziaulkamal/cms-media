/**
 * src/modules/ads/dto/create-ad-slot.dto.ts
 * Kontrak input pembuatan slot iklan (posisi bernama).
 */
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Field untuk membuat slot iklan; key dipakai frontend sebagai acuan posisi. */
export class CreateAdSlotDto {
  /** Identifier stabil, huruf kecil/angka/underscore (mis. "home_top"). */
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'key hanya boleh huruf kecil, angka, dan underscore.',
  })
  key!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  /** Lebar bidang (px) yang di-reserve; penting untuk AMP & anti-CLS. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4000)
  width?: number;

  /** Tinggi bidang (px) yang di-reserve. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4000)
  height?: number;

  /** Apakah slot ini ikut tampil di halaman AMP. */
  @IsOptional()
  @IsBoolean()
  isAmpEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
