/**
 * src/modules/settings/dto/bulk-update-settings.dto.ts
 * Kontrak update massal nilai setting yang sudah ada (form pengaturan).
 */
import { IsObject } from 'class-validator';

/** Map { key: value } untuk memperbarui banyak setting sekaligus. */
export class BulkUpdateSettingsDto {
  @IsObject()
  values!: Record<string, unknown>;
}
