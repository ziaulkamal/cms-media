/**
 * src/modules/tags/tags.controller.ts
 * Endpoint Tag: baca publik + buat (editor ke atas).
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
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BulkIdsDto } from '../../common/dto/bulk-ids.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

/** Route tag; GET publik, tulis butuh peran editor ke atas. */
@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Public()
  @Get()
  list() {
    return this.tags.list();
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.tags.getBySlug(slug);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tags.create(dto);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    return this.tags.update(id, dto);
  }

  /** Hapus banyak tag sekaligus. */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Post('bulk-delete')
  bulkRemove(@Body() dto: BulkIdsDto) {
    return this.tags.bulkRemove(dto.ids);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tags.remove(id);
  }
}
