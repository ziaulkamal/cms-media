/**
 * src/modules/gallery/gallery-albums.controller.ts
 * Endpoint album galeri: baca publik + kelola (admin/editor/author).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateAlbumDto, UpdateAlbumDto } from './dto/album.dto';
import { GalleryService } from './gallery.service';

/** Peran yang boleh mengelola album. */
const MANAGE_ROLES = [UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR];

/** Route album galeri (di bawah /gallery/albums). */
@ApiTags('Gallery')
@Controller('gallery/albums')
export class GalleryAlbumsController {
  constructor(private readonly gallery: GalleryService) {}

  /** Daftar album (publik). */
  @Public()
  @Get()
  list() {
    return this.gallery.listAlbums();
  }

  /** Buat album baru. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Post()
  create(@Body() dto: CreateAlbumDto) {
    return this.gallery.createAlbum(dto);
  }

  /** Ubah album. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlbumDto,
  ) {
    return this.gallery.updateAlbum(id, dto);
  }

  /** Hapus album. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.gallery.removeAlbum(id);
  }
}
