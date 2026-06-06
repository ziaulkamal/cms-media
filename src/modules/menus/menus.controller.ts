/**
 * src/modules/menus/menus.controller.ts
 * Endpoint Menu: baca publik (WEB) + kelola (editor ke atas).
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
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import { ReorderMenusDto } from './dto/reorder-menus.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenusService } from './menus.service';

/** Route menu; GET publik tergrup, tulis butuh peran editor ke atas. */
@ApiTags('Menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  /** Menu publik (terlihat) tergrup per lokasi & berjenjang — untuk WEB. */
  @Public()
  @Get()
  publicMenus() {
    return this.menus.getPublicMenus();
  }

  /** Daftar satu lokasi (termasuk tersembunyi) sebagai pohon — untuk admin. */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get('manage')
  manage(@Query() query: MenuQueryDto) {
    return this.menus.listByLocation(query.location);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateMenuItemDto) {
    return this.menus.create(dto);
  }

  /** Susun ulang urutan & jenjang satu lokasi (drag-and-drop). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch('reorder')
  reorder(@Body() dto: ReorderMenusDto) {
    return this.menus.reorder(dto);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menus.update(id, dto);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.menus.remove(id);
  }
}
