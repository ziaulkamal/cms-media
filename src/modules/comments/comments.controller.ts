/**
 * src/modules/comments/comments.controller.ts
 * Endpoint Comment: tulis & baca publik + moderasi (editor ke atas).
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
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CommentsService } from './comments.service';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ModerationQueryDto } from './dto/moderation-query.dto';

/** Route komentar; tulis/baca publik, moderasi butuh editor ke atas. */
@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  /** Tulis komentar (publik, rate-limited); masuk antrean moderasi. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateCommentDto) {
    return this.comments.create(dto);
  }

  /** Daftar komentar APPROVED untuk sebuah artikel (publik). */
  @Public()
  @Get()
  list(@Query() query: CommentQueryDto) {
    return this.comments.listApproved(query.articleId, query.page, query.perPage);
  }

  /** Daftar komentar untuk moderasi (editor ke atas). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get('moderation')
  moderationList(@Query() query: ModerationQueryDto) {
    return this.comments.listForModeration({
      status: query.status,
      articleId: query.articleId,
      page: query.page,
      perPage: query.perPage,
    });
  }

  /** Rekap jumlah komentar per status (editor ke atas). */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Get('moderation/stats')
  moderationStats() {
    return this.comments.moderationStats();
  }

  /** Setujui komentar. */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.comments.approve(id);
  }

  /** Tandai komentar sebagai spam. */
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @Patch(':id/spam')
  spam(@Param('id', ParseUUIDPipe) id: string) {
    return this.comments.markSpam(id);
  }
}
