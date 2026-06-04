/**
 * src/modules/pages/dto/page-query.dto.ts
 * Query daftar halaman: paginasi (warisan) + filter status opsional.
 */
import { PageStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Filter daftar halaman untuk panel admin. */
export class PageQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;
}
