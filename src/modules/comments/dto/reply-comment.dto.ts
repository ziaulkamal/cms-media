/**
 * src/modules/comments/dto/reply-comment.dto.ts
 * Kontrak balasan komentar oleh staf (editor/admin) dari panel moderasi.
 */
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Isi balasan staf; langsung APPROVED & ditandai sebagai panitia. */
export class ReplyCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;
}
