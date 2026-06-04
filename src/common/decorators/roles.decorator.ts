/**
 * src/common/decorators/roles.decorator.ts
 * Mendeklarasikan peran yang diizinkan untuk sebuah route (dibaca RolesGuard).
 */
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Batasi akses route hanya untuk peran tertentu (RBAC, default-deny). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
