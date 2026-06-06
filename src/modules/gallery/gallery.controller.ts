/**
 * src/modules/gallery/gallery.controller.ts
 * Endpoint Gallery: baca publik + kelola foto (admin/editor/author).
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
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateGalleryPhotoDto } from './dto/create-gallery-photo.dto';
import { GalleryQueryDto } from './dto/gallery-query.dto';
import { UpdateGalleryPhotoDto } from './dto/update-gallery-photo.dto';
import { GalleryService } from './gallery.service';

/** Peran yang boleh mengelola galeri. */
const MANAGE_ROLES = [UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR];

/** Route galeri; GET publik (foto published), kelola butuh staf editorial. */
@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  /** Daftar foto publik (published) dgn filter kategori/album. */
  @Public()
  @Get()
  listPublic(@Query() query: GalleryQueryDto) {
    return this.gallery.listPublic(query);
  }

  /** Daftar foto untuk panel admin (semua status). */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Get('manage')
  listManage(@Query() query: PaginationQueryDto) {
    return this.gallery.listManage(query.page, query.perPage);
  }

  /** Daftarkan foto galeri dari aset Media. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Post()
  create(@Body() dto: CreateGalleryPhotoDto) {
    return this.gallery.createPhoto(dto);
  }

  /** Ubah metadata foto galeri. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryPhotoDto,
  ) {
    return this.gallery.updatePhoto(id, dto);
  }

  /** Hapus foto galeri. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.gallery.removePhoto(id);
  }
}
