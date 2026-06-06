/**
 * src/common/guards/csrf.guard.ts
 * Proteksi CSRF double-submit untuk request mutasi berbasis cookie (SPA).
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ForbiddenError } from '../errors/domain-error';
import { ACCESS_TOKEN_COOKIE, CSRF_TOKEN_COOKIE } from '../utils/auth-cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Wajibkan header X-CSRF-Token == cookie csrf_token pada mutasi.
 * Hanya berlaku saat ada kredensial cookie ambient (sesi SPA); request
 * Bearer dan anonim (tanpa cookie auth, mis. tulis publik) dilewati.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(req.method)) return true;
    if (req.headers.authorization?.startsWith('Bearer ')) return true;

    const cookies = req.cookies as Record<string, string> | undefined;
    // Tanpa cookie sesi, tak ada kredensial yang bisa "diboncengi" CSRF.
    if (!cookies?.[ACCESS_TOKEN_COOKIE]) return true;

    const cookieToken = cookies[CSRF_TOKEN_COOKIE];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || cookieToken !== headerToken) {
      throw new ForbiddenError('CSRF token tidak valid atau tidak ada.');
    }
    return true;
  }
}
