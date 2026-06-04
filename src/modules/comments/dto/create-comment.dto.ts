/**
 * src/modules/comments/dto/create-comment.dto.ts
 * Kontrak input komentar pembaca (publik); divalidasi di boundary.
 */
import {
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field untuk menulis komentar; masuk antrean moderasi (PENDING). */
export class CreateCommentDto {
  @IsUUID()
  articleId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  authorName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;
}
