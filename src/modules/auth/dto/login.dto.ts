/**
 * src/modules/auth/dto/login.dto.ts
 * Kontrak input login (validasi boundary).
 */
import { IsEmail, IsString, MinLength } from 'class-validator';

/** Kredensial login. */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
