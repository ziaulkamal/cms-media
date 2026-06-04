/**
 * src/modules/categories/dto/update-category.dto.ts
 * Kontrak perubahan kategori; field opsional, tetap ter-whitelist.
 */
import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/** Subset opsional dari CreateCategoryDto. */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
