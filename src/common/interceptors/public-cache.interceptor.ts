/**
 * src/common/interceptors/public-cache.interceptor.ts
 * Set Cache-Control pada GET baca-publik (@Public) untuk caching CDN/browser.
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** Header cache untuk endpoint baca-publik: edge-friendly + stale-while-revalidate. */
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

/** Tambahkan Cache-Control hanya pada GET yang ditandai @Public. */
@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      const req = context.switchToHttp().getRequest<Request>();
      if (isPublic && req.method === 'GET') {
        const res = context.switchToHttp().getResponse<Response>();
        res.setHeader('Cache-Control', PUBLIC_CACHE);
      }
    }
    return next.handle();
  }
}
