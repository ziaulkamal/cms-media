/**
 * src/modules/gallery/gallery.module.ts
 * Modul Gallery: foto & album di atas modul Media.
 */
import { Module } from '@nestjs/common';
import { GalleryAlbumsController } from './gallery-albums.controller';
import { GalleryController } from './gallery.controller';
import { GalleryRepository } from './gallery.repository';
import { GalleryService } from './gallery.service';

@Module({
  controllers: [GalleryAlbumsController, GalleryController],
  providers: [GalleryService, GalleryRepository],
})
export class GalleryModule {}
