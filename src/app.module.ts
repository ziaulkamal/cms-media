/**
 * src/app.module.ts
 * Root module: config tervalidasi, throttler, Prisma, guards global, dan modul fitur.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { WsAwareThrottlerGuard } from './common/guards/ws-aware-throttler.guard';
import { PublicCacheInterceptor } from './common/interceptors/public-cache.interceptor';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { CsrfGuard } from './common/guards/csrf.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { AdsModule } from './modules/ads/ads.module';
import { MediaModule } from './modules/media/media.module';
import { CommentsModule } from './modules/comments/comments.module';
import { HealthModule } from './modules/health/health.module';
import { PagesModule } from './modules/pages/pages.module';
import { SettingsModule } from './modules/settings/settings.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { ContactModule } from './modules/contact/contact.module';
import { LiveStreamsModule } from './modules/live-streams/live-streams.module';
import { VenueContentModule } from './modules/venue-content/venue-content.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { MenusModule } from './modules/menus/menus.module';
import { DevModule } from './modules/dev/dev.module';

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
    AuthModule,
    UsersModule,
    ArticlesModule,
    CategoriesModule,
    TagsModule,
    AdsModule,
    MediaModule,
    CommentsModule,
    HealthModule,
    PagesModule,
    SettingsModule,
    GalleryModule,
    ContactModule,
    LiveStreamsModule,
    VenueContentModule,
    RealtimeModule,
    MenusModule,
    DevModule,
  ],
  providers: [
    // Urutan penting: rate-limit -> CSRF -> autentikasi -> otorisasi (RBAC).
    { provide: APP_GUARD, useClass: WsAwareThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: PublicCacheInterceptor },
  ],
})
export class AppModule {}
