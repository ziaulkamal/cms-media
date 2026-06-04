/**
 * src/common/interceptors/logging.interceptor.ts
 * Memberi setiap request requestId + log terstruktur durasi (tanpa secret/PII).
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Lampirkan correlation id ke request dan catat metode, path, status, durasi. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string }>();
    const res = http.getResponse<Response>();

    req.requestId = (req.headers['x-request-id'] as string) ?? nanoid();
    res.setHeader('x-request-id', req.requestId);
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - startedAt;
        this.logger.log(
          `[${req.requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`,
        );
      }),
    );
  }
}
