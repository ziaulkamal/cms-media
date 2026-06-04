/**
 * src/common/filters/all-exceptions.filter.ts
 * Filter global: memetakan semua error ke envelope error seragam, tanpa membocorkan internal.
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../errors/domain-error';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/** Menangkap seluruh exception dan menulis envelope { success:false, error, requestId }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const { status, body } = this.resolve(exception);

    // Detail penuh hanya ke log server; client tidak pernah melihat stack/query.
    if (status >= 500) {
      this.logger.error(
        `[${request.requestId ?? '-'}] ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${request.requestId ?? '-'}] ${request.method} ${request.url} -> ${body.code}`,
      );
    }

    response.status(status).json({
      success: false,
      error: body,
      requestId: request.requestId,
    });
  }

  /** Petakan exception apa pun menjadi status + body error yang aman. */
  private resolve(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof DomainError) {
      return {
        status: exception.status,
        body: { code: exception.code, message: exception.message },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as Record<string, unknown>).message as string) ??
            exception.message;
      const details =
        typeof res === 'object'
          ? (res as Record<string, unknown>).message
          : undefined;
      return {
        status,
        body: {
          code: this.codeFromStatus(status),
          message: Array.isArray(message) ? 'Validasi gagal.' : message,
          details: Array.isArray(details) ? details : undefined,
        },
      };
    }

    return {
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal.' },
    };
  }

  /** Kode mesin default berdasarkan status HTTP untuk error non-domain. */
  private codeFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
    };
    return map[status] ?? 'ERROR';
  }
}
