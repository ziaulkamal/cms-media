/**
 * src/modules/users/dto/update-user.dto.ts
 * Kontrak input perubahan user; semua field opsional, tetap ter-whitelist.
 */
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field yang boleh diubah pada user (password diatur via endpoint terpisah bila perlu). */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
