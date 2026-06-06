/**
 * src/config/env.validation.ts
 * Skema validasi environment variable (gagal cepat saat boot bila config salah).
 */
import * as Joi from 'joi';

/** Schema Joi untuk memvalidasi seluruh env yang dipakai aplikasi. */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  PORT_RANGE_START: Joi.number().port().default(3001),
  PORT_RANGE_END: Joi.number().port().default(3010),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  CORS_ORIGINS: Joi.string().default(
    'http://localhost:3001,http://localhost:5173,http://localhost:5174',
  ),
  SIMPORA_API_URL: Joi.string().uri().default('http://simpora2026.test/api/v1'),
  SIMPORA_POLL_MS: Joi.number().integer().min(1000).default(4000),

  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  DIRECT_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .optional(),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.string().default('900s'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  COOKIE_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  COOKIE_SAMESITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  COOKIE_DOMAIN: Joi.string().optional().allow(''),

  STORAGE_DRIVER: Joi.string().valid('local', 's3').default('local'),
  STORAGE_LOCAL_DIR: Joi.string().default('storage/uploads'),
  STORAGE_PUBLIC_BASE_URL: Joi.string().default('http://localhost:3001/uploads'),
  MEDIA_MAX_SIZE_BYTES: Joi.number().positive().default(10485760),

  THROTTLE_TTL: Joi.number().positive().default(60),
  THROTTLE_LIMIT: Joi.number().positive().default(100),
});
