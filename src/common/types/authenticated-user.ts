/**
 * src/common/types/authenticated-user.ts
 * Bentuk identitas pemanggil yang ditempelkan ke request setelah autentikasi.
 */
import { UserRole } from '@prisma/client';

/** Payload terverifikasi dari access token; sumber AuthZ di guard & controller. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

/** Klaim yang disimpan di dalam JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
