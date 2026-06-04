/**
 * src/modules/comments/dto/comment-query.dto.ts
 * Query daftar komentar publik (per artikel) + paginasi warisan.
 */
import { IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Filter daftar komentar publik: wajib menyebut artikel. */
export class CommentQueryDto extends PaginationQueryDto {
  @IsUUID()
  articleId!: string;
}
