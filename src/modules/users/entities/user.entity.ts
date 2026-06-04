/**
 * src/modules/users/entities/user.entity.ts
 * Bentuk publik User (tanpa passwordHash) + mapper dari entity Prisma.
 */
import { User, UserRole } from '@prisma/client';

/** Representasi User yang aman dikirim ke client (kredensial tidak ikut). */
export interface UserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

/** Petakan entity Prisma ke UserView; pastikan passwordHash tidak bocor. */
export function toUserView(user: User): UserView {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
