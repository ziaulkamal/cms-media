/**
 * src/modules/articles/articles.repository.ts
 * Akses data Article: query Prisma + jalur full-text search (raw, ranked).
 */
import { Injectable } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ArticleWithRelations,
  articleInclude,
} from './entities/article.entity';

/** Filter daftar artikel yang dipakai jalur Prisma maupun search. */
export interface ArticleListFilter {
  status?: ArticleStatus;
  categorySlug?: string;
  tagSlug?: string;
  authorId?: string;
}

/** Repository Article: pembungkus query agar reusable & menghindari N+1 (eager include). */
@Injectable()
export class ArticlesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ArticleCreateInput): Promise<ArticleWithRelations> {
    return this.prisma.article.create({ data, include: articleInclude });
  }

  findById(id: string): Promise<ArticleWithRelations | null> {
    return this.prisma.article.findUnique({
      where: { id },
      include: articleInclude,
    });
  }

  findPublishedBySlug(slug: string): Promise<ArticleWithRelations | null> {
    return this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      include: articleInclude,
    });
  }

  update(
    id: string,
    data: Prisma.ArticleUpdateInput,
  ): Promise<ArticleWithRelations> {
    return this.prisma.article.update({
      where: { id },
      data,
      include: articleInclude,
    });
  }

  /** Apakah slug sudah dipakai (untuk menjamin keunikan). */
  async slugExists(slug: string): Promise<boolean> {
    const found = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    return found !== null;
  }

  /** Naikkan penghitung view secara atomik (hindari race read-modify-write). */
  async incrementView(id: string): Promise<void> {
    await this.prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /** Daftar artikel via Prisma (tanpa full-text search). */
  async paginate(
    filter: ArticleListFilter,
    skip: number,
    take: number,
  ): Promise<[ArticleWithRelations[], number]> {
    const where: Prisma.ArticleWhereInput = {
      status: filter.status,
      authorId: filter.authorId,
      category: filter.categorySlug ? { slug: filter.categorySlug } : undefined,
      tags: filter.tagSlug
        ? { some: { tag: { slug: filter.tagSlug } } }
        : undefined,
    };
    return this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.article.count({ where }),
    ]);
  }

  /** Daftar artikel published via full-text search (ranked), lalu muat relasinya. */
  async searchPublished(
    q: string,
    filter: ArticleListFilter,
    skip: number,
    take: number,
  ): Promise<[ArticleWithRelations[], number]> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`a.status = 'PUBLISHED'::"ArticleStatus"`,
      Prisma.sql`a.tsv @@ websearch_to_tsquery('simple', ${q})`,
    ];
    if (filter.categorySlug) {
      conditions.push(
        Prisma.sql`a.category_id IN (SELECT id FROM categories WHERE slug = ${filter.categorySlug})`,
      );
    }
    if (filter.tagSlug) {
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id = a.id AND t.slug = ${filter.tagSlug})`,
      );
    }
    const whereSql = Prisma.join(conditions, ' AND ');

    const idRows = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT a.id FROM articles a
        WHERE ${whereSql}
        ORDER BY ts_rank(a.tsv, websearch_to_tsquery('simple', ${q})) DESC,
                 a.published_at DESC NULLS LAST
        LIMIT ${take} OFFSET ${skip}`,
    );
    const countRows = await this.prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*)::bigint AS count FROM articles a WHERE ${whereSql}`,
    );

    const ids = idRows.map((r) => r.id);
    const total = Number(countRows[0]?.count ?? 0);
    if (ids.length === 0) return [[], total];

    const articles = await this.prisma.article.findMany({
      where: { id: { in: ids } },
      include: articleInclude,
    });
    const byId = new Map(articles.map((a) => [a.id, a]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((a): a is ArticleWithRelations => a !== undefined);
    return [ordered, total];
  }

  /** Transaksi publish: ubah status + publishedAt, sekaligus simpan Revision. */
  async publishWithRevision(
    id: string,
    status: ArticleStatus,
    publishedAt: Date,
    editorId: string,
    snapshot: Prisma.InputJsonValue,
  ): Promise<ArticleWithRelations> {
    const [, article] = await this.prisma.$transaction([
      this.prisma.revision.create({
        data: { articleId: id, editorId, snapshot },
      }),
      this.prisma.article.update({
        where: { id },
        data: { status, publishedAt },
        include: articleInclude,
      }),
    ]);
    return article;
  }
}
