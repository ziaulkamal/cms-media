/**
 * src/main.ts
 * Bootstrap aplikasi: security headers, CORS, global pipe/filter/interceptor, prefix versioned.
 */
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createServer } from 'net';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  CSRF_TOKEN_COOKIE,
  issueCsrfCookie,
} from './common/utils/auth-cookies';

/** Cek apakah sebuah port bebas (bind sementara lalu lepas). */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port);
  });
}

/** Port bebas pertama: coba port utama, lalu pindai rentang fallback. */
async function resolvePort(config: ConfigService): Promise<number> {
  const preferred = config.get<number>('port') ?? 3001;
  const { start, end } = config.get<{ start: number; end: number }>(
    'portRange',
  ) ?? { start: 3001, end: 3010 };

  const candidates = [
    preferred,
    ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
  ].filter((p, i, arr) => arr.indexOf(p) === i);

  for (const port of candidates) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(
    `Tidak ada port tersedia (utama ${preferred}, rentang ${start}-${end}).`,
  );
}

/** Inisialisasi dan jalankan HTTP server Nest dengan fondasi keamanan global. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });
  const config = app.get(ConfigService);

  // crossOriginResourcePolicy dilonggarkan agar aset /uploads bisa dimuat lintas origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Parse cookie agar token httpOnly & CSRF terbaca guard/strategy.
  app.use(cookieParser());

  // Seed cookie CSRF pada request aman bila belum ada (double-submit pattern).
  app.use((req: Request, res: Response, next: NextFunction) => {
    const cookies = req.cookies as Record<string, string> | undefined;
    if (!cookies?.[CSRF_TOKEN_COOKIE]) issueCsrfCookie(res, config);
    next();
  });

  // Serve berkas media lokal di /uploads. Nama file = uuid unik & tak pernah
  // ditimpa → aman cache jangka panjang (immutable) untuk menekan load WEB.
  const uploadsDir = config.get<string>('storage.localDir') ?? 'storage/uploads';
  app.useStaticAssets(join(process.cwd(), uploadsDir), {
    prefix: '/uploads',
    maxAge: '30d',
    immutable: true,
  });
  app.enableCors({
    origin: config.get<string[]>('corsOrigins'),
    credentials: true,
  });

  // Validasi & whitelist input di boundary (anti mass-assignment).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const prefix = config.get<string>('apiPrefix');
  const version = config.get<string>('apiVersion');
  // Kecualikan halaman share crawler agar URL bersih: /share/... (bukan /api/v1/share).
  app.setGlobalPrefix(`${prefix}/${version}`, {
    exclude: [
      { path: 'share', method: RequestMethod.GET },
      { path: 'share/berita/:slug', method: RequestMethod.GET },
    ],
  });

  // Dokumentasi OpenAPI (kontrak API) di /api/docs; JSON di /api/docs-json.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CMS Media API')
    .setDescription(
      'Backend platform media berita. Semua response memakai envelope ' +
        '{ success, data, meta? } atau { success:false, error }.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = await resolvePort(config);
  await app.listen(port);
  Logger.log(`Server listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
