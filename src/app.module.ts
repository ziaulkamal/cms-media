/**
 * src/app.module.ts
 * Root module: memuat config tervalidasi, throttler, Prisma, dan modul fitur.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('throttle.ttl')) * 1000,
          limit: Number(config.get('throttle.limit')),
        },
      ],
    }),
    PrismaModule,
    // Modul fitur ditambahkan di langkah berikutnya:
    // AuthModule, UsersModule, ArticlesModule, CategoriesModule,
    // TagsModule, MediaModule, CommentsModule.
  ],
})
export class AppModule {}
