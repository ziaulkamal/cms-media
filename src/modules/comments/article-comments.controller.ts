/**
 * src/modules/comments/article-comments.controller.ts
 * Endpoint komentar publik berbasis slug artikel (baca tree + tulis berjenjang).
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CommentsService } from './comments.service';
import { CreatePublicCommentDto } from './dto/create-public-comment.dto';

/** Route publik komentar per artikel: GET pohon approved, POST tulis (rate-limited). */
@ApiTags('Comments')
@Controller('articles/:slug/comments')
export class ArticleCommentsController {
  constructor(private readonly comments: CommentsService) {}

  /** Pohon komentar APPROVED artikel (root + balasan; tanpa email). */
  @Public()
  @Get()
  list(@Param('slug') slug: string) {
    return this.comments.listTreeBySlug(slug);
  }

  /** Tulis komentar/balasan; masuk antrean moderasi (PENDING). */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Param('slug') slug: string, @Body() dto: CreatePublicCommentDto) {
    return this.comments.createBySlug(slug, dto);
  }
}
