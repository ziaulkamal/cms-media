/**
 * src/modules/comments/comments.repository.ts
 * Akses data Comment + cek artikel layak dikomentari (terpusat di repository).
 */
import { Injectable } from '@nestjs/common';
import {
  ArticleStatus,
  Comment,
  CommentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Repository Comment: pembungkus query Prisma untuk komentar & moderasi. */
@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CommentCreateInput): Promise<Comment> {
    return this.prisma.comment.create({ data });
  }

  findById(id: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: CommentStatus): Promise<Comment> {
    return this.prisma.comment.update({ where: { id }, data: { status } });
  }

  /** Apakah artikel ada dan sudah PUBLISHED (boleh dikomentari). */
  async isArticleCommentable(articleId: string): Promise<boolean> {
    const found = await this.prisma.article.findFirst({
      where: { id: articleId, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });
    return found !== null;
  }

  /** Daftar komentar APPROVED sebuah artikel (publik), terbaru dulu. */
  async paginateApproved(
    articleId: string,
    skip: number,
    take: number,
  ): Promise<[Comment[], number]> {
    const where: Prisma.CommentWhereInput = {
      articleId,
      status: CommentStatus.APPROVED,
    };
    return this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.comment.count({ where }),
    ]);
  }

  /** Daftar komentar untuk moderasi dengan filter status & artikel opsional. */
  async paginateForModeration(
    filter: { status?: CommentStatus; articleId?: string },
    skip: number,
    take: number,
  ): Promise<[Comment[], number]> {
    const where: Prisma.CommentWhereInput = {
      status: filter.status,
      articleId: filter.articleId,
    };
    return this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.comment.count({ where }),
    ]);
  }
}
