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

/** Comment beserta ringkasan artikel asal (hasil query moderasi). */
export type CommentWithArticle = Prisma.CommentGetPayload<{
  include: { article: { select: { id: true; title: true; slug: true } } };
}>;

/** Comment + relasi user (untuk deteksi badge panitia saat membangun tree). */
export type CommentWithUser = Prisma.CommentGetPayload<{
  include: { user: { select: { id: true; role: true } } };
}>;

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

  /** Hapus komentar; balasannya ikut terhapus (relasi onDelete: Cascade). */
  delete(id: string): Promise<{ id: string }> {
    return this.prisma.comment.delete({ where: { id }, select: { id: true } });
  }

  async deleteMany(ids: string[]): Promise<number> {
    const { count } = await this.prisma.comment.deleteMany({
      where: { id: { in: ids } },
    });
    return count;
  }

  /** Apakah artikel ada dan sudah PUBLISHED (boleh dikomentari). */
  async isArticleCommentable(articleId: string): Promise<boolean> {
    const found = await this.prisma.article.findFirst({
      where: { id: articleId, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });
    return found !== null;
  }

  /** Id artikel PUBLISHED berdasarkan slug, atau null bila tak layak. */
  async findPublishedArticleIdBySlug(slug: string): Promise<string | null> {
    const found = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });
    return found?.id ?? null;
  }

  /** Semua komentar APPROVED suatu artikel (datar) + relasi user, terlama dulu. */
  findApprovedForTree(articleId: string): Promise<CommentWithUser[]> {
    return this.prisma.comment.findMany({
      where: { articleId, status: CommentStatus.APPROVED },
      include: { user: { select: { id: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Komentar APPROVED tunggal milik artikel (validasi parent balasan). */
  findApprovedById(id: string, articleId: string): Promise<Comment | null> {
    return this.prisma.comment.findFirst({
      where: { id, articleId, status: CommentStatus.APPROVED },
    });
  }

  /** Naikkan likeCount komentar APPROVED secara atomik; null bila tak ada. */
  async incrementLike(id: string): Promise<Comment | null> {
    const result = await this.prisma.comment.updateMany({
      where: { id, status: CommentStatus.APPROVED },
      data: { likeCount: { increment: 1 } },
    });
    if (result.count === 0) return null;
    return this.prisma.comment.findUnique({ where: { id } });
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

  /** Daftar komentar untuk moderasi (dengan artikel asal) + filter opsional. */
  async paginateForModeration(
    filter: { status?: CommentStatus; articleId?: string },
    skip: number,
    take: number,
  ): Promise<[CommentWithArticle[], number]> {
    const where: Prisma.CommentWhereInput = {
      status: filter.status,
      articleId: filter.articleId,
    };
    return this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        include: {
          article: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.comment.count({ where }),
    ]);
  }

  /** Rekap jumlah komentar per status (untuk ringkasan moderasi). */
  async countByStatus(): Promise<Array<{ status: CommentStatus; count: number }>> {
    const rows = await this.prisma.comment.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  }
}
