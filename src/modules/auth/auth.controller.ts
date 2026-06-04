/**
 * src/modules/auth/auth.controller.ts
 * Endpoint autentikasi: login (publik, rate-limited), refresh, logout.
 */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

/** Route autentikasi; login dibatasi ketat untuk menahan brute force. */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Login publik; rate-limit ketat: 5 percobaan / menit. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  /** Tukar refresh token dengan pasangan token baru (rotasi). */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.refresh(user);
  }

  /** Logout: token stateless dibuang di sisi client (revocation -> Redis, fase 9). */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logout berhasil. Hapus token di sisi client.' };
  }
}
