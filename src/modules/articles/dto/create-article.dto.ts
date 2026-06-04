/**
 * src/modules/articles/dto/create-article.dto.ts
 * Kontrak input pembuatan artikel (validasi + whitelist field).
 */
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field yang boleh dikirim saat membuat artikel (status awal selalu DRAFT). */
export class CreateArticleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  /** Konten kaya berbentuk JSON (mis. blok editor). */
  @IsObject()
  body!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  featuredMediaId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string;
}
