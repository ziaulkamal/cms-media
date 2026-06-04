/**
 * src/modules/settings/settings.controller.ts
 * Endpoint Setting: map publik (SEO/meta) + pengelolaan dinamis (ADMIN).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BulkUpdateSettingsDto } from './dto/bulk-update-settings.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { SettingsService } from './settings.service';

/** Route setting; map publik tanpa auth, pengelolaan khusus ADMIN. */
@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Map { key: value } setting publik untuk konsumsi frontend (SEO/meta). */
  @Public()
  @Get('public')
  publicMap() {
    return this.settings.getPublicMap();
  }

  /** Daftar lengkap setting (ADMIN). */
  @Roles(UserRole.ADMIN)
  @Get()
  list() {
    return this.settings.list();
  }

  /** Ambil satu setting via key (ADMIN). */
  @Roles(UserRole.ADMIN)
  @Get(':key')
  get(@Param('key') key: string) {
    return this.settings.getByKey(key);
  }

  /** Update massal nilai setting yang ada (ADMIN). */
  @Roles(UserRole.ADMIN)
  @Patch()
  bulkUpdate(@Body() dto: BulkUpdateSettingsDto) {
    return this.settings.bulkUpdate(dto.values);
  }

  /** Tambah/ubah satu setting dinamis via key (ADMIN). */
  @Roles(UserRole.ADMIN)
  @Put(':key')
  upsert(@Param('key') key: string, @Body() dto: UpsertSettingDto) {
    return this.settings.upsert(key, dto);
  }

  /** Hapus setting (ADMIN). */
  @Roles(UserRole.ADMIN)
  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.settings.remove(key);
  }
}
