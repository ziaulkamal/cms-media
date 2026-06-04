/**
 * src/modules/auth/strategies/jwt-refresh.strategy.ts
 * Strategi refresh token: verifikasi JWT refresh untuk endpoint rotasi token.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/types/authenticated-user';
import { REFRESH_TOKEN_COOKIE } from '../../../common/utils/auth-cookies';

/** Ambil refresh token dari cookie httpOnly; fallback ke header Authorization. */
function refreshTokenFromRequest(req: Request): string | null {
  return (
    (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ] ?? null
  );
}

/** Validasi refresh token via JWT_REFRESH_SECRET (dipakai guard 'jwt-refresh'). */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        refreshTokenFromRequest,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.refreshSecret') as string,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
