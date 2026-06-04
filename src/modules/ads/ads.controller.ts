/**
 * src/modules/ads/ads.controller.ts
 * Endpoint Ads: serve publik per slot + kelola slot/creative (editor ke atas).
 */
import {
  Body,
  Controller,
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
import { AdsService } from './ads.service';
import { CreateAdCreativeDto } from './dto/create-ad-creative.dto';
import { CreateAdSlotDto } from './dto/create-ad-slot.dto';
import { UpdateAdCreativeDto } from './dto/update-ad-creative.dto';
import { UpdateAdSlotDto } from './dto/update-ad-slot.dto';

/** Route iklan; serve publik via key slot, pengelolaan butuh editor ke atas. */
@ApiTags('Ads')
@ApiBearerAuth()
@Controller('ads')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  /** Serve creative yang sedang tayang untuk sebuah posisi (key slot) per platform. */
  @Public()
  @Get('slots/:key/serve')
  serve(@Param('key') key: string, @Query('platform') platform?: string) {
    const target = (platform ?? '').toLowerCase() === 'amp' ? 'AMP' : 'WEB';
    return this.ads.serve(key, target);
  }

  // --- Pengelolaan (EDITOR/ADMIN) ---

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get('slots')
  listSlots() {
    return this.ads.listSlots();
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Post('slots')
  createSlot(@Body() dto: CreateAdSlotDto) {
    return this.ads.createSlot(dto);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch('slots/:id')
  updateSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdSlotDto,
  ) {
    return this.ads.updateSlot(id, dto);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get('slots/:id/creatives')
  listCreatives(@Param('id', ParseUUIDPipe) id: string) {
    return this.ads.listCreatives(id);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Post('slots/:id/creatives')
  createCreative(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAdCreativeDto,
  ) {
    return this.ads.createCreative(id, dto);
  }

  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch('creatives/:id')
  updateCreative(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdCreativeDto,
  ) {
    return this.ads.updateCreative(id, dto);
  }
}
