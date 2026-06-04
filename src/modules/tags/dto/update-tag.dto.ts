/**
 * src/modules/tags/dto/update-tag.dto.ts
 * Kontrak perubahan tag (rename → slug diregenerasi di service).
 */
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Field yang boleh diubah pada tag. */
export class UpdateTagDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;
}
