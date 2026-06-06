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
  Req,
  Res,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CommentsService } from './comments.service';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ModerationQueryDto } from './dto/moderation-query.dto';

/** Cookie penanda komentar yang sudah disukai perangkat ini (dedup suka). */
const LIKED_COOKIE = 'liked_comments';
/** Masa hidup cookie suka: 1 tahun. */
const LIKED_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

/** Urai daftar id komentar yang sudah disukai dari nilai cookie. */
function parseLiked(raw: unknown): Set<string> {
  if (typeof raw !== 'string' || !raw) return new Set();
  return new Set(raw.split(',').filter(Boolean));
}

/** Route komentar; tulis/baca publik, moderasi butuh editor ke atas. */
@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly comments: CommentsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Suka komentar (publik, idempoten). Dedup per-perangkat via cookie:
   * id yang sudah ada di cookie tidak menaikkan likeCount lagi.
   */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post(':id/like')
  async like(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const liked = parseLiked(req.cookies?.[LIKED_COOKIE]);
    if (liked.has(id)) {
      // Sudah pernah disukai dari perangkat ini: kembalikan jumlah terkini.
      const current = await this.comments.likeCount(id);
      return { id, likeCount: current };
    }
    const result = await this.comments.like(id);
    liked.add(id);
    res.cookie(LIKED_COOKIE, [...liked].join(','), {
      httpOnly: false,
      secure: this.config.get<boolean>('cookie.secure'),
      sameSite: this.config.get<'lax' | 'strict' | 'none'>('cookie.sameSite'),
      domain: this.config.get<string | undefined>('cookie.domain'),
      path: '/',
      maxAge: LIKED_MAX_AGE,
    });
    return result;
  }

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
