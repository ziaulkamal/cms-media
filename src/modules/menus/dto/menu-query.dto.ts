/**
 * src/modules/menus/dto/menu-query.dto.ts
 * Filter daftar menu untuk panel admin (per lokasi).
 */
import { MenuLocation } from '@prisma/client';
import { IsEnum } from 'class-validator';

/** Query wajib lokasi untuk endpoint manage. */
export class MenuQueryDto {
  @IsEnum(MenuLocation)
  location!: MenuLocation;
}
