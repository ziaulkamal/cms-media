/**
 * src/modules/tags/dto/create-tag.dto.ts
 * Kontrak input pembuatan tag (validasi boundary).
 */
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Field untuk membuat tag baru. */
export class CreateTagDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;
}
