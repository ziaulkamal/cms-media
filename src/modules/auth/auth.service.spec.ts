/**
 * src/modules/auth/auth.service.spec.ts
 * Uji AuthService: login sukses menerbitkan token, login gagal melempar 401.
 */
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { UnauthorizedError } from '../../common/errors/domain-error';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: 'u1',
    email: 'admin@cms.local',
    role: UserRole.ADMIN,
  } as User;

  const usersService = { verifyCredentials: jest.fn() } as unknown as UsersService;
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
  } as unknown as JwtService;
  const config = { get: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;

  const service = new AuthService(usersService, jwtService, config);

  afterEach(() => jest.clearAllMocks());

  it('login sukses mengembalikan access + refresh token', async () => {
    (usersService.verifyCredentials as jest.Mock).mockResolvedValue(user);
    const tokens = await service.login(user.email, 'password123');
    expect(tokens.accessToken).toBe('signed-token');
    expect(tokens.refreshToken).toBe('signed-token');
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
  });

  it('login gagal (kredensial salah) melempar UnauthorizedError', async () => {
    (usersService.verifyCredentials as jest.Mock).mockResolvedValue(null);
    await expect(service.login(user.email, 'salah')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
