/**
 * src/modules/users/dto/set-password.dto.ts
 * Kontrak input admin menetapkan password spesifik untuk user terpilih.
 */
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Password baru yang ditetapkan admin untuk user lain. */
export class SetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
