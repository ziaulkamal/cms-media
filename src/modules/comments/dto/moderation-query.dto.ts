/**
 * src/modules/comments/dto/moderation-query.dto.ts
 * Query daftar komentar untuk moderasi (filter status & artikel opsional).
 */
import { CommentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Filter moderasi komentar (editor ke atas). */
export class ModerationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus;

  @IsOptional()
  @IsUUID()
  articleId?: string;
}
