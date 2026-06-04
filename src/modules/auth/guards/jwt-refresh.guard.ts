/**
 * src/modules/auth/guards/jwt-refresh.guard.ts
 * Guard khusus endpoint refresh: memvalidasi refresh token (strategi 'jwt-refresh').
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Aktifkan strategi 'jwt-refresh' hanya pada route refresh. */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
