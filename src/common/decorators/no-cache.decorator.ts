/**
 * src/common/decorators/no-cache.decorator.ts
 * Menandai route publik agar TIDAK di-cache (data digerakkan realtime).
 */
import { SetMetadata } from '@nestjs/common';

export const NO_CACHE_KEY = 'noCache';

/** Tandai GET publik sebagai realtime → PublicCacheInterceptor set no-store. */
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true);
