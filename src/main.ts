/**
 * src/main.ts
 * Bootstrap aplikasi: security headers, CORS, global pipe/filter/interceptor, prefix versioned.
 */
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

/** Inisialisasi dan jalankan HTTP server Nest dengan fondasi keamanan global. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });
  const config = app.get(ConfigService);

  // crossOriginResourcePolicy dilonggarkan agar aset /uploads bisa dimuat lintas origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Serve berkas media lokal sebagai aset statis publik di /uploads.
  const uploadsDir = config.get<string>('storage.localDir') ?? 'storage/uploads';
  app.useStaticAssets(join(process.cwd(), uploadsDir), { prefix: '/uploads' });
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
  app.setGlobalPrefix(`${prefix}/${version}`);

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

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
}

void bootstrap();
