/**
 * src/modules/live-streams/live-streams.controller.ts
 * Endpoint LiveStream: serving publik + kelola kanal (admin/editor/author).
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
  Put,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { NoCache } from '../../common/decorators/no-cache.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateLiveStreamDto } from './dto/create-live-stream.dto';
import { UpdateLiveStreamDto } from './dto/update-live-stream.dto';
import { LiveStreamsService } from './live-streams.service';

/** Peran yang boleh mengelola kanal siaran. */
const MANAGE_ROLES = [UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR];

/** Route kanal siaran; GET publik (serving), kelola butuh staf editorial. */
@ApiTags('LiveStreams')
@Controller('live-streams')
export class LiveStreamsController {
  constructor(private readonly streams: LiveStreamsService) {}

  /** Serving publik: master saklar + daftar kanal (realtime → tanpa cache). */
  @Public()
  @NoCache()
  @Get()
  serve() {
    return this.streams.serve();
  }

  /** Daftar kanal untuk panel admin. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Get('manage')
  listManage() {
    return this.streams.listManage();
  }

  /** Opsi pertandingan (ongoing+scheduled) dari CORE untuk penaut kanal. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Get('match-options')
  matchOptions() {
    return this.streams.fetchMatchOptions();
  }

  /** Buat kanal baru. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Post()
  create(@Body() dto: CreateLiveStreamDto) {
    return this.streams.create(dto);
  }

  /** Ubah kanal. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLiveStreamDto,
  ) {
    return this.streams.update(id, dto);
  }

  /** Toggle status tayang kanal (isLive). */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Patch(':id/toggle')
  toggle(@Param('id', ParseUUIDPipe) id: string) {
    return this.streams.toggle(id);
  }

  /** Toggle sorotan kanal (maks 2). */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Patch(':id/feature')
  toggleFeatured(@Param('id', ParseUUIDPipe) id: string) {
    return this.streams.toggleFeatured(id);
  }

  /** Hapus kanal. */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.streams.remove(id);
  }
}
