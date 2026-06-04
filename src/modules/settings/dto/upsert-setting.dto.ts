/**
 * src/modules/settings/dto/upsert-setting.dto.ts
 * Kontrak tambah/ubah satu setting dinamis (metadata + nilai fleksibel).
 */
import { SettingType } from '@prisma/client';
import {
  Allow,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Field metadata + nilai untuk membuat/memperbarui sebuah setting. */
export class UpsertSettingDto {
  /** Nilai bebas (string/number/boolean/object); @Allow agar lolos whitelist. */
  @Allow()
  value?: unknown;

  @IsOptional()
  @IsEnum(SettingType)
  type?: SettingType;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  group?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
