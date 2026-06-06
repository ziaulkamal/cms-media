/**
 * src/modules/contact/dto/create-contact.dto.ts
 * Kontrak kirim pesan kontak (publik) + field honeypot anti-bot.
 */
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field form kontak; `website` adalah honeypot (harus kosong). */
export class CreateContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  message!: string;

  /**
   * Honeypot: field tersembunyi di form. Bot mengisinya; manusia membiarkan
   * kosong. Bila terisi, pesan diperlakukan sebagai SPAM.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
