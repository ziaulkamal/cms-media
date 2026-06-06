/**
 * src/modules/menus/dto/update-menu-item.dto.ts
 * Kontrak perubahan item menu. Lokasi & jenjang diatur lewat reorder (drag),
 * jadi update hanya menyentuh atribut tampilan/tautan.
 */
import { MenuLinkType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Field opsional yang boleh diubah pada item menu. */
export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsEnum(MenuLinkType)
  type?: MenuLinkType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string | null;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
