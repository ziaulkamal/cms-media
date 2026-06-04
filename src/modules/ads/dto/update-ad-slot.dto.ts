/**
 * src/modules/ads/dto/update-ad-slot.dto.ts
 * Kontrak perubahan slot iklan; field opsional, tetap ter-whitelist.
 */
import { PartialType } from '@nestjs/swagger';
import { CreateAdSlotDto } from './create-ad-slot.dto';

/** Subset opsional dari CreateAdSlotDto. */
export class UpdateAdSlotDto extends PartialType(CreateAdSlotDto) {}
