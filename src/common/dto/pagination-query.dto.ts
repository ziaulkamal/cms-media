/**
 * src/common/dto/pagination-query.dto.ts
 * DTO query paginasi/sort dipakai ulang lintas endpoint list (DRY).
 */
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Parameter paginasi & sort standar untuk semua endpoint list. */
export class PaginationQueryDto {
  /** Halaman ke-n (mulai 1). */
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  /** Jumlah item per halaman (dibatasi agar tidak unbounded). */
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 20;

  /** Field sort, prefix '-' utk desc (mis. "-publishedAt"). */
  @IsOptional()
  @IsString()
  sort?: string;

  /** Offset hasil hitung dari page & perPage. */
  get skip(): number {
    return (this.page - 1) * this.perPage;
  }
}
