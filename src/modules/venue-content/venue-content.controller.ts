/**
 * src/modules/venue-content/venue-content.controller.ts
 * Endpoint VenueContent: baca publik + kelola (admin/editor) + proxy venue simpora.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpsertVenueContentDto } from './dto/upsert-venue-content.dto';
import { VenueContentService } from './venue-content.service';

/** Peran yang boleh mengelola konten venue. */
const MANAGE_ROLES = [UserRole.ADMIN, UserRole.EDITOR];

/** Route konten venue; GET publik, kelola + proxy venue butuh staf. */
@ApiTags('VenueContent')
@Controller('venue-content')
export class VenueContentController {
  constructor(private readonly venue: VenueContentService) {}

  /** Daftar konten venue (publik). */
  @Public()
  @Get()
  list() {
    return this.venue.list();
  }

  /** Proxy READ-ONLY daftar venue simpora2026 (dropdown admin). */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Get('sources/venues')
  sources() {
    return this.venue.fetchVenueSources();
  }

  /** Konten venue tunggal via venueRef (publik). */
  @Public()
  @Get(':ref')
  getByRef(@Param('ref') ref: string) {
    return this.venue.getByRef(ref);
  }

  /** Buat/perbarui konten venue (admin). */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Post()
  upsert(@Body() dto: UpsertVenueContentDto) {
    return this.venue.upsert(dto);
  }

  /** Hapus konten venue via venueRef (admin). */
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Delete(':ref')
  remove(@Param('ref') ref: string) {
    return this.venue.remove(ref);
  }
}
