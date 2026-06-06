/**
 * src/modules/contact/contact.controller.ts
 * Endpoint Contact: kirim publik (rate-limited + honeypot) + kelola inbox admin.
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
  Req,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ContactService } from './contact.service';
import { ContactQueryDto } from './dto/contact-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

/** Route kontak; POST publik (rate-limited), sisanya inbox admin. */
@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /** Kirim pesan kontak (publik, maks 3/menit). */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post()
  submit(@Body() dto: CreateContactDto, @Req() req: Request) {
    return this.contact.submit(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  /** Daftar inbox kontak (admin: filter status + paginasi). */
  @ApiBearerAuth()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get()
  list(@Query() query: ContactQueryDto) {
    return this.contact.list(query);
  }

  /** Rekap jumlah pesan per status (badge NEW). */
  @ApiBearerAuth()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get('stats')
  stats() {
    return this.contact.stats();
  }

  /** Detail satu pesan (admin). */
  @ApiBearerAuth()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.contact.getById(id);
  }

  /** Ubah status pesan (admin). */
  @ApiBearerAuth()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch(':id')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactStatusDto,
  ) {
    return this.contact.updateStatus(id, dto.status);
  }

  /** Hapus pesan (admin). */
  @ApiBearerAuth()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contact.remove(id);
  }
}
