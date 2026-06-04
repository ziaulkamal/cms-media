/**
 * src/common/interceptors/response.interceptor.ts
 * Membungkus response sukses ke envelope { success:true, data, meta? } secara seragam.
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Payload list ber-paginasi yang dikembalikan service (dipisah jadi data + meta). */
export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/** Type guard: apakah payload merupakan hasil paginasi. */
function isPaginated<T>(value: unknown): value is Paginated<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'meta' in value
  );
}

/** Standarisasi seluruh response sukses menjadi satu bentuk envelope. */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (isPaginated(payload)) {
          return { success: true, data: payload.items, meta: payload.meta };
        }
        return { success: true, data: payload };
      }),
    );
  }
}
