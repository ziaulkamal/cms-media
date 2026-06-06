/**
 * src/modules/menus/dto/reorder-menus.dto.ts
 * Susun ulang seluruh menu satu lokasi (urutan + jenjang) dalam satu transaksi.
 */
import { MenuLocation } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Satu simpul pada susunan baru: induk (null = root) + posisi antar-saudara. */
export class MenuPositionDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsInt()
  @Min(0)
  position!: number;
}

/** Susunan menu menyeluruh untuk satu lokasi. */
export class ReorderMenusDto {
  @IsEnum(MenuLocation)
  location!: MenuLocation;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => MenuPositionDto)
  items!: MenuPositionDto[];
}
