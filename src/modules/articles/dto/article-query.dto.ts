/**
 * src/modules/articles/dto/article-query.dto.ts
 * Query daftar artikel: paginasi/sort (warisan) + filter & full-text search.
 */
import { ArticleStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Filter daftar artikel publik & manajemen. */
export class ArticleQueryDto extends PaginationQueryDto {
  /** Filter status (hanya dipakai di endpoint manajemen). */
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  /** Slug kategori. */
  @IsOptional()
  @IsString()
  category?: string;

  /** Slug tag. */
  @IsOptional()
  @IsString()
  tag?: string;

  /** Kata kunci full-text search. */
  @IsOptional()
  @IsString()
  q?: string;
}
