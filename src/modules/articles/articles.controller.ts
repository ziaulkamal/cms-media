/**
 * src/modules/articles/articles.controller.ts
 * Endpoint Article: baca publik + tulis/workflow (terproteksi, thin controller).
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ArticlesService } from './articles.service';
import { ArticleQueryDto } from './dto/article-query.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { PublishArticleDto } from './dto/publish-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

/** Route artikel; GET publik (hanya PUBLISHED), sisanya butuh autentikasi. */
@ApiTags('Articles')
@ApiBearerAuth()
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  /** Daftar artikel publik dengan filter, sort, paginasi, dan search (q). */
  @Public()
  @Get()
  listPublic(@Query() query: ArticleQueryDto) {
    return this.articles.listPublic({
      page: query.page,
      perPage: query.perPage,
      category: query.category,
      tag: query.tag,
      q: query.q,
    });
  }

  /** Daftar artikel milik staf (editor: semua; penulis: miliknya). */
  @Get('manage')
  listManage(
    @Query() query: ArticleQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articles.listManage(query, user);
  }

  /** Buat artikel baru (status DRAFT). */
  @Post()
  create(
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articles.create(dto, user);
  }

  /** Ajukan artikel untuk review. */
  @Post(':id/submit')
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articles.submit(id, user);
  }

  /** Publikasikan/jadwalkan artikel (editor ke atas). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Post(':id/publish')
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishArticleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articles.publish(id, dto, user);
  }

  /** Arsipkan artikel. */
  @Post(':id/archive')
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articles.archive(id, user);
  }

  /** Ubah artikel (pemilik atau editor ke atas). */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articles.update(id, dto, user);
  }

  /** Ambil satu artikel publik via slug (menaikkan view). */
  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.articles.getPublicBySlug(slug);
  }
}
