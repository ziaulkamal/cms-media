/**
 * src/modules/categories/dto/create-category.dto.ts
 * Kontrak input pembuatan kategori (validasi boundary).
 */
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Field yang boleh dikirim untuk membuat kategori. */
export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  /** Kategori induk (untuk hierarki rubrik), opsional. */
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
