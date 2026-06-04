/**
 * src/modules/ads/dto/update-ad-creative.dto.ts
 * Kontrak perubahan creative; field opsional, tetap ter-whitelist.
 */
import { PartialType } from '@nestjs/swagger';
import { CreateAdCreativeDto } from './create-ad-creative.dto';

/** Subset opsional dari CreateAdCreativeDto. */
export class UpdateAdCreativeDto extends PartialType(CreateAdCreativeDto) {}
