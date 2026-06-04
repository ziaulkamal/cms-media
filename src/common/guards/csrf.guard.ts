/**
 * src/common/guards/csrf.guard.ts
 * Proteksi CSRF double-submit untuk request mutasi berbasis cookie (SPA).
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ForbiddenError } from '../errors/domain-error';
import { CSRF_TOKEN_COOKIE } from '../utils/auth-cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Wajibkan header X-CSRF-Token == cookie csrf_token pada mutasi.
 * Klien API berbasis Bearer dilewati (tak rentan CSRF lewat cookie).
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(req.method)) return true;
    if (req.headers.authorization?.startsWith('Bearer ')) return true;

    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
      CSRF_TOKEN_COOKIE
    ];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || cookieToken !== headerToken) {
      throw new ForbiddenError('CSRF token tidak valid atau tidak ada.');
    }
    return true;
  }
}
