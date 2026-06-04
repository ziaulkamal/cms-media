/**
 * src/common/dto/paginated.ts
 * Helper membangun payload paginasi standar yang dipahami ResponseInterceptor.
 */
import { Paginated } from '../interceptors/response.interceptor';

/** Bungkus list + total menjadi payload paginasi (items + meta). */
export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number,
): Paginated<T> {
  return {
    items,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}
