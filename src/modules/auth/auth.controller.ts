/**
 * src/modules/auth/auth.controller.ts
 * Endpoint autentikasi berbasis httpOnly cookie: login, refresh, logout, me.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  clearAuthCookies,
  issueCsrfCookie,
  setAuthCookies,
} from '../../common/utils/auth-cookies';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

/** Route autentikasi; token disimpan di httpOnly cookie (aman dari XSS). */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  /** Login publik (rate-limit 5/menit): set cookie auth + CSRF, balikan profil user. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.auth.login(dto.email, dto.password);
    setAuthCookies(res, tokens, this.config);
    issueCsrfCookie(res, this.config);
    return this.users.getById(user.id);
  }

  /** Rotasi token dari refresh cookie -> set cookie baru. */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.refresh(user);
    setAuthCookies(res, tokens, this.config);
    issueCsrfCookie(res, this.config);
    return this.users.getById(user.id);
  }

  /** Logout: hapus kedua cookie auth (token stateless dibuang). */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookies(res, this.config);
    return { message: 'Logout berhasil.' };
  }

  /** Profil pengguna saat ini (sumber role untuk SPA berbasis cookie). */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getById(user.id);
  }

  /** Ganti password mandiri (butuh password lama); token tetap berlaku. */
  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password berhasil diubah.' };
  }
}
