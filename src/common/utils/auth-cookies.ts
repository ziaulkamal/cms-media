/**
 * src/common/utils/auth-cookies.ts
 * Sumber tunggal nama & opsi cookie auth (httpOnly access/refresh + CSRF double-submit).
 */
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { TokenPair } from '../../modules/auth/auth.service';
import { ttlToMs } from './duration';

/** Cookie token akses (httpOnly; tidak pernah dibaca JS). */
export const ACCESS_TOKEN_COOKIE = 'access_token';
/** Cookie refresh token (httpOnly; hanya dikirim ke /auth/refresh secara efektif). */
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
/** Cookie CSRF (DIBACA JS; dikirim balik via header X-CSRF-Token). */
export const CSRF_TOKEN_COOKIE = 'csrf_token';

/** Bentuk opsi cookie dasar dari config (secure/sameSite/domain seragam). */
function baseOptions(config: ConfigService): CookieOptions {
  return {
    secure: config.get<boolean>('cookie.secure'),
    sameSite: config.get<'lax' | 'strict' | 'none'>('cookie.sameSite'),
    domain: config.get<string | undefined>('cookie.domain'),
    path: '/',
  };
}

/** Set cookie access + refresh sebagai httpOnly dengan masa hidup sesuai TTL token. */
export function setAuthCookies(
  res: Response,
  tokens: TokenPair,
  config: ConfigService,
): void {
  const base = baseOptions(config);
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...base,
    httpOnly: true,
    maxAge: ttlToMs(config.get<string>('jwt.accessTtl') as string),
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...base,
    httpOnly: true,
    maxAge: ttlToMs(config.get<string>('jwt.refreshTtl') as string),
  });
}

/** Hapus kedua cookie auth (logout). */
export function clearAuthCookies(res: Response, config: ConfigService): void {
  const base = baseOptions(config);
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...base, httpOnly: true });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...base, httpOnly: true });
}

/** Terbitkan token CSRF acak ke cookie non-httpOnly; kembalikan nilainya. */
export function issueCsrfCookie(res: Response, config: ConfigService): string {
  const token = randomBytes(32).toString('hex');
  res.cookie(CSRF_TOKEN_COOKIE, token, {
    ...baseOptions(config),
    httpOnly: false,
    maxAge: ttlToMs(config.get<string>('jwt.refreshTtl') as string),
  });
  return token;
}
