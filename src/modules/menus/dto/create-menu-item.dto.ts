/**
 * src/modules/menus/dto/create-menu-item.dto.ts
 * Kontrak pembuatan item menu (validasi boundary).
 */
import { MenuLinkType, MenuLocation } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field yang boleh dikirim untuk membuat item menu. */
export class CreateMenuItemDto {
  @IsEnum(MenuLocation)
  location!: MenuLocation;

  /** Induk (hanya FOOTER): jadikan item sebagai anak sebuah kolom. */
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsOptional()
  @IsEnum(MenuLinkType)
  type?: MenuLinkType;

  /** Nilai tautan; kosongkan untuk judul kolom footer. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
