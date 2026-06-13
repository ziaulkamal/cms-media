/**
 * src/modules/auth/dto/change-password.dto.ts
 * Kontrak input ganti password mandiri: butuh password lama + password baru.
 */
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Field untuk user mengganti password-nya sendiri. */
export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
