/**
 * src/modules/pages/pages.controller.ts
 * Endpoint Page: baca publik (slug) + kelola (editor ke atas).
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
import { CreatePageDto } from './dto/create-page.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagesService } from './pages.service';

/** Route halaman statis; GET slug publik, pengelolaan butuh editor ke atas. */
@ApiTags('Pages')
@ApiBearerAuth()
@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  /** Daftar halaman untuk panel admin (editor ke atas). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get()
  list(@Query() query: PageQueryDto) {
    return this.pages.list(query.page, query.perPage, query.status);
  }

  /** Detail halaman via id untuk editor (editor ke atas). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get('manage/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.pages.getById(id);
  }

  /** Buat halaman (editor ke atas). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreatePageDto) {
    return this.pages.create(dto);
  }

  /** Ubah halaman (editor ke atas). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePageDto) {
    return this.pages.update(id, dto);
  }

  /** Hapus halaman non-wajib (editor ke atas). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pages.remove(id);
  }

  /** Ambil halaman publik via slug (hanya PUBLISHED). */
  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.pages.getPublicBySlug(slug);
  }
}
