/**
 * src/modules/media/media.controller.ts
 * Endpoint Media: unggah multipart + kelola metadata (butuh autentikasi).
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaService } from './media.service';

/** Batas keras unggahan di lapisan transport (validasi final di service). */
const HARD_UPLOAD_LIMIT = 20 * 1024 * 1024;

/** Route media; seluruh aksi butuh autentikasi (staf). */
@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Unggah satu berkas gambar (field "file"). */
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: HARD_UPLOAD_LIMIT } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Body('alt') alt?: string,
  ) {
    return this.media.upload(file, user, alt);
  }

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.media.list(query.page, query.perPage);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.getById(id);
  }

  /** Ubah metadata media (judul/deskripsi/alt) untuk SEO. */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.media.updateMeta(id, dto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.media.remove(id, user);
  }
}
