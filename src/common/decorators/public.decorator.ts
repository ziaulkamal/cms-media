/**
 * src/common/decorators/public.decorator.ts
 * Menandai route sebagai publik agar lolos dari JwtAuthGuard global.
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Tandai handler/controller sebagai publik (tanpa autentikasi). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
