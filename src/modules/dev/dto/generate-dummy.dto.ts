/**
 * src/modules/dev/dto/generate-dummy.dto.ts
 * Kontrak generate data dummy; tiap jenis opsional agar bisa per-tombol di admin.
 */
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Pilihan jenis & jumlah data dummy yang akan dibuat. */
export class GenerateDummyDto {
  /** Buat 10 kategori dummy. */
  @IsOptional()
  @IsBoolean()
  categories?: boolean;

  /** Buat 10 tag dummy. */
  @IsOptional()
  @IsBoolean()
  tags?: boolean;

  /** Jumlah artikel dummy (0 = lewati). */
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(100)
  articles?: number;

  /** Buat komentar dummy pada artikel dummy. */
  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  /** Jumlah foto galeri dummy (0 = lewati). */
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(100)
  gallery?: number;
}
