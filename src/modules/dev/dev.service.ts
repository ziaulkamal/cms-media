/**
 * src/modules/dev/dev.service.ts
 * Generator data dummy (kategori/tag/artikel/komentar/galeri) untuk panel admin.
 * Semua data berlabel "dummy"/"DUMMY" agar mudah dibersihkan kembali.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ArticleStatus,
  Category,
  CommentStatus,
  PhotoOrientation,
  Prisma,
  Tag,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { makeSolidPng } from '../../common/utils/png';
import { slugify } from '../../common/utils/slug';
import {
  STORAGE_PORT,
  StoragePort,
} from '../media/storage/storage-port';
import { GenerateDummyDto } from './dto/generate-dummy.dto';

/** Penanda data dummy (dipakai untuk membuat & membersihkan). */
const CATEGORY_PREFIX = 'dummy-kategori-';
const TAG_PREFIX = 'dummy-tag-';
const ARTICLE_PREFIX = 'dummy-artikel-';
const MEDIA_LABEL = 'DUMMY';

/** Ringkasan jumlah data dummy hasil generate / yang tersisa. */
export interface DummyCounts {
  categories: number;
  tags: number;
  articles: number;
  comments: number;
  gallery: number;
}

/** Variasi dimensi foto (memicu orientasi otomatis yang berbeda). */
const PHOTO_DIMS: Array<{ w: number; h: number; o: PhotoOrientation }> = [
  { w: 480, h: 320, o: PhotoOrientation.LANSKAP },
  { w: 320, h: 480, o: PhotoOrientation.POTRET },
  { w: 360, h: 360, o: PhotoOrientation.KOTAK },
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randColor = (): [number, number, number] => [
  randInt(60, 220),
  randInt(60, 220),
  randInt(60, 220),
];

/** Bangun body artikel TipTap dari judul + paragraf (subjudul + kutipan demo). */
function buildBody(title: string): Prisma.InputJsonValue {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: title }] },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Ini paragraf konten dummy untuk pengembangan dan pratinjau tata letak.',
          },
        ],
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Kutipan contoh pada artikel dummy.' }],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Paragraf penutup dummy sebagai pelengkap isi.' },
        ],
      },
    ],
  };
}

/** Service generator dummy: buat & bersihkan data contoh dari panel admin. */
@Injectable()
export class DevService {
  private readonly logger = new Logger(DevService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  /** Orkestrasi generate sesuai pilihan; mengembalikan jumlah yang dibuat. */
  async generate(dto: GenerateDummyDto, userId: string): Promise<DummyCounts> {
    const result: DummyCounts = {
      categories: 0,
      tags: 0,
      articles: 0,
      comments: 0,
      gallery: 0,
    };

    if (dto.categories) result.categories = (await this.ensureCategories()).length;
    if (dto.tags) result.tags = (await this.ensureTags()).length;
    if (dto.articles && dto.articles > 0) {
      result.articles = await this.generateArticles(dto.articles, userId);
    }
    if (dto.comments) result.comments = await this.generateComments(userId);
    if (dto.gallery && dto.gallery > 0) {
      result.gallery = await this.generateGallery(dto.gallery, userId);
    }

    this.logger.log(`dummy.generate ${JSON.stringify(result)}`);
    return result;
  }

  /** Pastikan 10 kategori dummy ada (idempoten by slug). */
  private async ensureCategories(): Promise<Category[]> {
    const out: Category[] = [];
    for (let i = 1; i <= 10; i++) {
      const slug = `${CATEGORY_PREFIX}${i}`;
      out.push(
        await this.prisma.category.upsert({
          where: { slug },
          update: {},
          create: { slug, name: `Dummy Kategori ${i}` },
        }),
      );
    }
    return out;
  }

  /** Pastikan 10 tag dummy ada (idempoten by slug). */
  private async ensureTags(): Promise<Tag[]> {
    const out: Tag[] = [];
    for (let i = 1; i <= 10; i++) {
      const slug = `${TAG_PREFIX}${i}`;
      out.push(
        await this.prisma.tag.upsert({
          where: { slug },
          update: {},
          create: { slug, name: `Dummy Tag ${i}` },
        }),
      );
    }
    return out;
  }

  /** Buat N artikel dummy (PUBLISHED) dgn kategori & tag dummy acak. */
  private async generateArticles(n: number, userId: string): Promise<number> {
    const categories = await this.ensureCategories();
    const tags = await this.ensureTags();
    const base = await this.prisma.article.count({
      where: { slug: { startsWith: ARTICLE_PREFIX } },
    });

    let created = 0;
    for (let i = 0; i < n; i++) {
      const idx = base + i + 1;
      const title = `DUMMY Artikel ${idx}`;
      const slug = `${ARTICLE_PREFIX}${idx}-${slugify(String(Date.now() + i))}`;
      const tagSubset = tags
        .filter(() => Math.random() < 0.3)
        .slice(0, 3)
        .map((t) => ({ tag: { connect: { id: t.id } } }));

      await this.prisma.article.create({
        data: {
          slug,
          title,
          excerpt: 'Ringkasan artikel dummy untuk pengembangan.',
          body: buildBody(title),
          status: ArticleStatus.PUBLISHED,
          publishedAt: new Date(),
          viewCount: randInt(0, 5000),
          author: { connect: { id: userId } },
          category: { connect: { id: pick(categories).id } },
          tags: { create: tagSubset },
        },
      });
      created++;
    }
    return created;
  }

  /** Tambah komentar dummy (root + balasan + suka) pada artikel dummy. */
  private async generateComments(userId: string): Promise<number> {
    let articles = await this.prisma.article.findMany({
      where: { slug: { startsWith: ARTICLE_PREFIX } },
      select: { id: true },
    });
    if (articles.length === 0) {
      await this.generateArticles(3, userId);
      articles = await this.prisma.article.findMany({
        where: { slug: { startsWith: ARTICLE_PREFIX } },
        select: { id: true },
      });
    }

    let created = 0;
    for (const article of articles) {
      const roots = randInt(1, 3);
      for (let r = 0; r < roots; r++) {
        const root = await this.prisma.comment.create({
          data: {
            article: { connect: { id: article.id } },
            authorName: `DUMMY Pembaca ${randInt(1, 999)}`,
            body: 'Komentar dummy yang sudah disetujui.',
            status: CommentStatus.APPROVED,
            likeCount: randInt(0, 50),
          },
        });
        created++;
        const replies = randInt(0, 2);
        for (let k = 0; k < replies; k++) {
          await this.prisma.comment.create({
            data: {
              article: { connect: { id: article.id } },
              parent: { connect: { id: root.id } },
              authorName: `DUMMY Pembalas ${randInt(1, 999)}`,
              body: 'Balasan dummy berjenjang.',
              status: CommentStatus.APPROVED,
              likeCount: randInt(0, 20),
            },
          });
          created++;
        }
      }
    }
    return created;
  }

  /** Buat N foto galeri dummy: file PNG lokal -> Media -> GalleryPhoto. */
  private async generateGallery(n: number, userId: string): Promise<number> {
    let created = 0;
    for (let i = 0; i < n; i++) {
      const dim = pick(PHOTO_DIMS);
      const buffer = makeSolidPng(dim.w, dim.h, randColor());
      const storageKey = await this.storage.save({
        buffer,
        mimeType: 'image/png',
        originalName: `dummy-${Date.now()}-${i}.png`,
      });

      const media = await this.prisma.media.create({
        data: {
          storageKey,
          mimeType: 'image/png',
          size: buffer.length,
          width: dim.w,
          height: dim.h,
          title: `${MEDIA_LABEL} Foto ${randInt(1, 9999)}`,
          alt: 'Foto galeri dummy',
          uploadedBy: { connect: { id: userId } },
        },
      });

      await this.prisma.galleryPhoto.create({
        data: {
          media: { connect: { id: media.id } },
          caption: 'DUMMY keterangan foto galeri',
          category: pick(['Pembukaan', 'Pertandingan', 'Suporter', 'Venue']),
          orientation: dim.o,
          sortOrder: i,
          isPublished: true,
        },
      });
      created++;
    }
    return created;
  }

  /** Hitung data dummy yang saat ini ada. */
  async stats(): Promise<DummyCounts> {
    const [categories, tags, articles, comments, gallery] = await Promise.all([
      this.prisma.category.count({ where: { slug: { startsWith: CATEGORY_PREFIX } } }),
      this.prisma.tag.count({ where: { slug: { startsWith: TAG_PREFIX } } }),
      this.prisma.article.count({ where: { slug: { startsWith: ARTICLE_PREFIX } } }),
      this.prisma.comment.count({
        where: { article: { slug: { startsWith: ARTICLE_PREFIX } } },
      }),
      this.prisma.galleryPhoto.count({
        where: { media: { title: { startsWith: MEDIA_LABEL } } },
      }),
    ]);
    return { categories, tags, articles, comments, gallery };
  }

  /** Hapus semua data dummy (termasuk berkas galeri di storage). */
  async clear(): Promise<DummyCounts> {
    const before = await this.stats();

    // Galeri: hapus berkas fisik dulu, lalu Media (cascade ke GalleryPhoto).
    const media = await this.prisma.media.findMany({
      where: { title: { startsWith: MEDIA_LABEL } },
      select: { id: true, storageKey: true },
    });
    for (const m of media) await this.storage.delete(m.storageKey);
    await this.prisma.media.deleteMany({
      where: { id: { in: media.map((m) => m.id) } },
    });

    // Artikel dummy (cascade ke komentar & article_tags).
    await this.prisma.article.deleteMany({
      where: { slug: { startsWith: ARTICLE_PREFIX } },
    });
    await this.prisma.tag.deleteMany({ where: { slug: { startsWith: TAG_PREFIX } } });
    await this.prisma.category.deleteMany({
      where: { slug: { startsWith: CATEGORY_PREFIX } },
    });

    this.logger.log(`dummy.clear ${JSON.stringify(before)}`);
    return before;
  }
}
