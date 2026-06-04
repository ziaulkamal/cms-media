/**
 * src/config/configuration.ts
 * Memetakan env (sudah tervalidasi) menjadi objek config bertipe untuk DI.
 */

/** Bentuk config aplikasi yang diakses lewat ConfigService. */
export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  storage: {
    driver: string;
    localDir: string;
    publicBaseUrl: string;
    maxSizeBytes: number;
  };
  throttle: { ttl: number; limit: number };
}

/** Factory config yang dimuat ConfigModule saat boot. */
export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? 'v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET as string,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    localDir: process.env.STORAGE_LOCAL_DIR ?? 'storage/uploads',
    publicBaseUrl:
      process.env.STORAGE_PUBLIC_BASE_URL ?? 'http://localhost:3000/uploads',
    maxSizeBytes: Number(process.env.MEDIA_MAX_SIZE_BYTES ?? 10485760),
  },
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL ?? 60),
    limit: Number(process.env.THROTTLE_LIMIT ?? 100),
  },
});
