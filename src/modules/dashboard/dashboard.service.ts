/**
 * src/modules/dashboard/dashboard.service.ts
 * Agregasi ringkasan CMS untuk dashboard: KPI, tren publikasi, komposisi,
 * antrean "butuh aksi", dan artikel terpopuler — dalam satu query batch.
 */
import { Injectable } from '@nestjs/common';
import {
  ArticleStatus,
  CommentStatus,
  ContactStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Jumlah hari pada grafik tren publikasi. */
const TREND_DAYS = 14;
/** Maksimum item per daftar "butuh aksi" / leaderboard. */
const FEED_LIMIT = 5;

/** Kunci tanggal lokal (YYYY-M-D) untuk membucket tren konsisten antar zona. */
function localKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Service Dashboard: rangkum metrik lintas-modul untuk panel ringkasan. */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Kumpulkan seluruh metrik dashboard dalam satu transaksi baca. */
  async getStats() {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (TREND_DAYS - 1));

    const [
      articles,
      published,
      draft,
      pages,
      media,
      users,
      galleryPhotos,
      pendingComments,
      newContacts,
      liveActive,
      publishedForTrend,
      recentComments,
      recentContacts,
      liveList,
      topArticles,
    ] = await this.prisma.$transaction([
      this.prisma.article.count(),
      this.prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      this.prisma.article.count({ where: { status: ArticleStatus.DRAFT } }),
      this.prisma.page.count(),
      this.prisma.media.count(),
      this.prisma.user.count(),
      this.prisma.galleryPhoto.count(),
      this.prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
      this.prisma.contactMessage.count({ where: { status: ContactStatus.NEW } }),
      this.prisma.liveStream.count({ where: { isLive: true } }),
      this.prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: { gte: since },
        },
        select: { publishedAt: true },
      }),
      this.prisma.comment.findMany({
        where: { status: CommentStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        take: FEED_LIMIT,
        include: {
          article: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.contactMessage.findMany({
        where: { status: ContactStatus.NEW },
        orderBy: { createdAt: 'desc' },
        take: FEED_LIMIT,
        select: { id: true, name: true, subject: true, createdAt: true },
      }),
      this.prisma.liveStream.findMany({
        where: { isLive: true },
        orderBy: { sortOrder: 'asc' },
        take: FEED_LIMIT,
        select: { id: true, title: true, sportName: true, viewerCount: true },
      }),
      this.prisma.article.findMany({
        where: { status: ArticleStatus.PUBLISHED },
        orderBy: { viewCount: 'desc' },
        take: FEED_LIMIT,
        select: { id: true, title: true, viewCount: true },
      }),
    ]);

    return {
      counts: {
        articles,
        published,
        draft,
        pages,
        media,
        users,
        galleryPhotos,
        pendingComments,
        newContacts,
        liveActive,
      },
      composition: [
        { key: 'articles', label: 'Berita', value: articles },
        { key: 'pages', label: 'Laman', value: pages },
        { key: 'gallery', label: 'Galeri', value: galleryPhotos },
        { key: 'media', label: 'Media', value: media },
      ],
      trend: this.buildTrend(
        publishedForTrend.map((a) => a.publishedAt),
        since,
      ),
      feed: {
        comments: recentComments.map((c) => ({
          id: c.id,
          authorName: c.authorName,
          body: c.body,
          createdAt: c.createdAt,
          article: c.article,
        })),
        contacts: recentContacts,
        liveStreams: liveList,
      },
      topArticles,
    };
  }

  /** Bucket tanggal terbit ke deret harian sepanjang TREND_DAYS (label DD/MM). */
  private buildTrend(
    dates: Array<Date | null>,
    since: Date,
  ): { labels: string[]; values: number[] } {
    const labels: string[] = [];
    const order: string[] = [];
    const buckets = new Map<string, number>();

    for (let i = 0; i < TREND_DAYS; i += 1) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = localKey(d);
      order.push(key);
      buckets.set(key, 0);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      labels.push(`${dd}/${mm}`);
    }

    for (const dt of dates) {
      if (!dt) continue;
      const key = localKey(new Date(dt));
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return { labels, values: order.map((k) => buckets.get(k) ?? 0) };
  }
}
