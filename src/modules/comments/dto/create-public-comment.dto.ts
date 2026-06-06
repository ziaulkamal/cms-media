/**
 * src/modules/comments/dto/create-public-comment.dto.ts
 * Kontrak komentar publik via slug artikel (mendukung balasan berjenjang).
 */
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field tulis komentar publik; masuk antrean moderasi (PENDING). */
export class CreatePublicCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  authorName!: string;

  /** Email pengomentar (opsional); INTERNAL, tak pernah dikembalikan ke publik. */
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  authorEmail?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;

  /** Id komentar induk bila ini balasan. */
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
