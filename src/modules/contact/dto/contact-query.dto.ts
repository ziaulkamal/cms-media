/**
 * src/modules/contact/dto/contact-query.dto.ts
 * Filter daftar inbox kontak (admin): status + paginasi.
 */
import { IsEnum, IsOptional } from 'class-validator';
import { ContactStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Query inbox kontak (extend paginasi standar). */
export class ContactQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}
