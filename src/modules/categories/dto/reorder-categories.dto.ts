/**
 * src/modules/categories/dto/reorder-categories.dto.ts
 * Kontrak penyusunan ulang pohon kategori (urutan + jenjang) dalam satu transaksi.
 * Frontend mengirim SELURUH kategori dalam bentuk datar dengan induk & posisi barunya.
 */
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Satu simpul pada susunan baru: induk (null = root) + posisi antar-saudara. */
export class CategoryPositionDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsInt()
  @Min(0)
  position!: number;
}

/** Susunan pohon kategori secara menyeluruh. */
export class ReorderCategoriesDto {
  @IsArray()
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => CategoryPositionDto)
  items!: CategoryPositionDto[];
}
