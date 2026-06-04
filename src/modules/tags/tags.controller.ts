/**
 * src/modules/tags/tags.controller.ts
 * Endpoint Tag: baca publik + buat (editor ke atas).
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
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
}
