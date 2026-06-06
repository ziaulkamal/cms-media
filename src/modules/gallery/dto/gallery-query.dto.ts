/**
 * src/modules/gallery/dto/gallery-query.dto.ts
 * Filter daftar galeri publik: kategori, album, paginasi.
 */
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** Query publik galeri (extend paginasi standar). */
export class GalleryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID()
  album?: string;
}
