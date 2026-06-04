/**
 * src/modules/pages/dto/create-page.dto.ts
 * Kontrak input pembuatan halaman statis (validasi + whitelist field).
 */
import { PageStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field yang boleh dikirim saat membuat halaman. */
export class CreatePageDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  /** Konten kaya berbentuk JSON (blok editor). */
  @IsObject()
  body!: Record<string, unknown>;

  /** Slug kustom (opsional); bila kosong diturunkan dari judul. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string;

  /** Tandai halaman wajib (tak bisa dihapus). */
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}
