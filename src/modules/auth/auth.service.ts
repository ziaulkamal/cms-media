/**
 * src/modules/auth/auth.service.ts
 * Aturan autentikasi: verifikasi kredensial & terbitkan access/refresh token.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedError } from '../../common/errors/domain-error';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../common/types/authenticated-user';
import { UsersService } from '../users/users.service';

/** Pasangan token yang dikembalikan ke client. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Hasil login: token + identitas terverifikasi (dipakai controller set-cookie). */
export interface LoginResult {
  tokens: TokenPair;
  user: AuthenticatedUser;
}

/** Service Auth: login, refresh (rotasi), dan penerbitan token. */
@Injectable()
export class AuthService {
  private readonly audit = new Logger('Audit');

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Verifikasi email+password; lempar 401 bila gagal, jika sukses terbitkan token. */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.verifyCredentials(email, password);
    if (!user) {
      this.audit.warn(`login.failed email=${email}`);
      throw new UnauthorizedError('Email atau password salah.');
    }
    this.audit.log(`login.success userId=${user.id} role=${user.role}`);
    const identity: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return { tokens: await this.issueTokens(identity), user: identity };
  }

  /** Terbitkan token baru dari refresh token yang sudah tervalidasi (rotasi). */
  async refresh(user: AuthenticatedUser): Promise<TokenPair> {
    return this.issueTokens(user);
  }

  /** Tandatangani access + refresh token dengan secret & TTL masing-masing. */
  private async issueTokens(user: AuthenticatedUser): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshTtl'),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
