/**
 * src/modules/contact/dto/update-contact-status.dto.ts
 * Kontrak ubah status pesan kontak (admin).
 */
import { IsEnum } from 'class-validator';
import { ContactStatus } from '@prisma/client';

/** Ubah status pesan inbox (NEW/READ/REPLIED/SPAM/ARCHIVED). */
export class UpdateContactStatusDto {
  @IsEnum(ContactStatus)
  status!: ContactStatus;
}
