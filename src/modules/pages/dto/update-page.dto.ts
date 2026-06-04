/**
 * src/modules/pages/dto/update-page.dto.ts
 * Kontrak perubahan halaman; semua field opsional, tetap ter-whitelist.
 */
import { PartialType } from '@nestjs/swagger';
import { CreatePageDto } from './create-page.dto';

/** Field yang boleh diubah pada halaman (subset opsional dari Create). */
export class UpdatePageDto extends PartialType(CreatePageDto) {}
