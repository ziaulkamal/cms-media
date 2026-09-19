/**
 * src/modules/users/dto/delete-user-query.dto.ts
 * Query hapus user: penerima konten (wajib bila user masih punya konten).
 */
import { IsOptional, IsUUID } from 'class-validator';

export class DeleteUserQueryDto {
  /** User aktif penerima artikel, media, dan revisi milik user yang dihapus. */
  @IsOptional()
  @IsUUID()
  transferTo?: string;
}
