/**
 * src/common/guards/roles.guard.spec.ts
 * Uji RolesGuard: tanpa @Roles lolos, peran cocok lolos, peran salah ditolak.
 */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '../errors/domain-error';
import { AuthenticatedUser } from '../types/authenticated-user';
import { RolesGuard } from './roles.guard';

/** Bangun ExecutionContext palsu dengan user tertentu pada request. */
function contextWithUser(user?: AuthenticatedUser): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);
  const admin: AuthenticatedUser = {
    id: 'u1',
    email: 'a@b.c',
    role: UserRole.ADMIN,
  };

  it('mengizinkan ketika route tidak menetapkan peran (default open)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextWithUser(admin))).toBe(true);
  });

  it('mengizinkan ketika peran user termasuk yang dibutuhkan', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN, UserRole.EDITOR]);
    expect(guard.canActivate(contextWithUser(admin))).toBe(true);
  });

  it('menolak (Forbidden) ketika peran tidak cocok', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.EDITOR]);
    const author: AuthenticatedUser = { ...admin, role: UserRole.AUTHOR };
    expect(() => guard.canActivate(contextWithUser(author))).toThrow(
      ForbiddenError,
    );
  });

  it('menolak ketika tidak ada user (default-deny)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(
      ForbiddenError,
    );
  });
});
