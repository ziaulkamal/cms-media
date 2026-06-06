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
  ContactStatus,
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
const VENUE_REF_PREFIX = 'dummy-venue-';
const LIVE_MATCHREF_PREFIX = 'dummy-live-';
const CONTACT_EMAIL_DOMAIN = '@dummy.local';

/** Ringkasan jumlah data dummy hasil generate / yang tersisa. */
export interface DummyCounts {
  categories: number;
  tags: number;
  articles: number;
  comments: number;
  gallery: number;
  liveStreams: number;
  venue: number;
  contact: number;
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

// --- Kumpulan kata untuk konten dummy bervariasi (bukan string tunggal). ---
const CATEGORY_NAMES = [
  'Sepak Bola', 'Bulu Tangkis', 'Atletik', 'Renang', 'Bola Voli',
  'Pencak Silat', 'Karate', 'Catur', 'Tenis Meja', 'Panahan',
];
const TAG_NAMES = [
  'PORA', 'Aceh Jaya', 'Medali Emas', 'Pembukaan', 'Final',
  'Tuan Rumah', 'Atlet Muda', 'Rekor', 'Semifinal', 'Penutupan',
];
const TITLE_SUBJECTS = [
  'Tim Putra', 'Tim Putri', 'Kontingen Aceh Jaya', 'Atlet Senior',
  'Tuan Rumah', 'Wasit', 'Panitia', 'Pelatih Kepala',
];
const TITLE_ACTIONS = [
  'Raih Emas di Hari Pertama', 'Lolos ke Babak Final', 'Pecahkan Rekor Daerah',
  'Tatap Laga Penentuan', 'Siapkan Strategi Baru', 'Sambut Antusiasme Suporter',
  'Tutup Laga dengan Kemenangan', 'Jalani Latihan Intensif',
];
const PARAGRAPHS = [
  'Pertandingan berlangsung sengit sejak menit awal dan disambut antusias penonton.',
  'Panitia memastikan seluruh venue siap dan jadwal berjalan sesuai rencana.',
  'Para atlet menunjukkan performa terbaik demi mengharumkan nama daerahnya.',
  'Dukungan suporter menjadi energi tambahan bagi kontingen tuan rumah.',
  'Hasil ini menambah perolehan medali dan memperketat persaingan klasemen.',
  'Pelatih menilai kerja keras tim membuahkan hasil yang membanggakan.',
];
const QUOTES = [
  'Kami bangga dengan perjuangan seluruh atlet hari ini.',
  'Target kami jelas: tampil maksimal di setiap pertandingan.',
  'Dukungan masyarakat sangat berarti bagi tim.',
];
const COMMENT_BODIES = [
  'Selamat untuk para atlet, luar biasa!', 'Semoga menang terus, semangat!',
  'Pertandingan tadi seru sekali.', 'Bangga jadi tuan rumah PORA.',
  'Ditunggu laga berikutnya.', 'Kerja keras yang terbayar.',
  'Suporter tuan rumah memang luar biasa.', 'Semoga membawa pulang emas.',
];
const COMMENTER_NAMES = [
  'Rahmat', 'Siti', 'Fauzan', 'Nadia', 'Iqbal', 'Dewi', 'Andi', 'Maya',
  'Rizki', 'Putri', 'Hendra', 'Lia',
];
const PHOTO_CATEGORIES = ['Pembukaan', 'Pertandingan', 'Suporter', 'Venue', 'Medali'];
const PHOTO_CAPTIONS = [
  'Momen pembukaan yang meriah', 'Aksi atlet di lapangan',
  'Antusiasme suporter tuan rumah', 'Suasana venue pertandingan',
  'Penyerahan medali juara',
];
// Video id YouTube valid agar thumbnail kanal dummy tampil.
const YOUTUBE_IDS = [
  'dQw4w9WgXcQ', '9bZkp7q19f0', '3JZ_D3ELwOQ', 'kJQP7kiw5Fk',
  'L_jWHffIx5E', 'fJ9rUzIMcZQ',
];
const VENUE_NAMES = [
  'Stadion Calang', 'GOR Lambeugak', 'Lapangan Krueng Sabee',
  'Kolam Renang Teunom', 'Gedung Serbaguna Panga', 'Lapangan Tenis Setia Bakti',
];
const CONTACT_SUBJECTS = [
  'Pertanyaan jadwal pertandingan', 'Permohonan liputan media',
  'Usulan kerja sama', 'Keluhan tiket masuk', 'Informasi venue',
  'Apresiasi penyelenggaraan',
];
const CONTACT_STATUSES = [
  ContactStatus.NEW, ContactStatus.READ, ContactStatus.REPLIED,
];

/** Bangun body artikel TipTap dgn subjudul + paragraf & kutipan acak. */
function buildBody(title: string): Prisma.InputJsonValue {
  const paras = [pick(PARAGRAPHS), pick(PARAGRAPHS)];
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: title }] },
      { type: 'paragraph', content: [{ type: 'text', text: paras[0] }] },
      {
        type: 'blockquote',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: pick(QUOTES) }] },
        ],
      },
      { type: 'paragraph', content: [{ type: 'text', text: paras[1] }] },
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
      liveStreams: 0,
      venue: 0,
      contact: 0,
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
    if (dto.liveStreams && dto.liveStreams > 0) {
      result.liveStreams = await this.generateLiveStreams(dto.liveStreams);
    }
    if (dto.venue && dto.venue > 0) {
      result.venue = await this.generateVenue(dto.venue);
    }
    if (dto.contact && dto.contact > 0) {
      result.contact = await this.generateContact(dto.contact);
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
          create: { slug, name: CATEGORY_NAMES[i - 1] },
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
          create: { slug, name: TAG_NAMES[i - 1] },
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
      const title = `${pick(TITLE_SUBJECTS)} ${pick(TITLE_ACTIONS)}`;
      const slug = `${ARTICLE_PREFIX}${idx}-${slugify(title)}-${Date.now() + i}`;
      const tagSubset = tags
        .filter(() => Math.random() < 0.3)
        .slice(0, 3)
        .map((t) => ({ tag: { connect: { id: t.id } } }));

      await this.prisma.article.create({
        data: {
          slug,
          title,
          excerpt: pick(PARAGRAPHS),
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
            authorName: pick(COMMENTER_NAMES),
            body: pick(COMMENT_BODIES),
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
              authorName: pick(COMMENTER_NAMES),
              body: pick(COMMENT_BODIES),
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
          caption: pick(PHOTO_CAPTIONS),
          category: pick(PHOTO_CATEGORIES),
          orientation: dim.o,
          sortOrder: i,
          isPublished: true,
        },
      });
      created++;
    }
    return created;
  }

  /** Buat N kanal siaran dummy (penanda: matchRef berawalan dummy-live-). */
  private async generateLiveStreams(n: number): Promise<number> {
    const base = await this.prisma.liveStream.count({
      where: { matchRef: { startsWith: LIVE_MATCHREF_PREFIX } },
    });
    for (let i = 0; i < n; i++) {
      await this.prisma.liveStream.create({
        data: {
          youtubeId: pick(YOUTUBE_IDS),
          title: `${pick(TITLE_SUBJECTS)} ${pick(TITLE_ACTIONS)}`,
          sportName: pick(CATEGORY_NAMES),
          venueName: pick(VENUE_NAMES),
          matchRef: `${LIVE_MATCHREF_PREFIX}${base + i + 1}`,
          viewerCount: randInt(0, 5000),
          isLive: Math.random() < 0.4,
          sortOrder: base + i,
        },
      });
    }
    return n;
  }

  /** Buat N konten venue dummy (penanda: venueRef berawalan dummy-venue-). */
  private async generateVenue(n: number): Promise<number> {
    const base = await this.prisma.venueContent.count({
      where: { venueRef: { startsWith: VENUE_REF_PREFIX } },
    });
    for (let i = 0; i < n; i++) {
      await this.prisma.venueContent.create({
        data: {
          venueRef: `${VENUE_REF_PREFIX}${base + i + 1}`,
          description: `${pick(VENUE_NAMES)} — ${pick(PARAGRAPHS)} ${pick(PARAGRAPHS)}`,
        },
      });
    }
    return n;
  }

  /** Buat N pesan kontak dummy (penanda: email berdomain @dummy.local). */
  private async generateContact(n: number): Promise<number> {
    for (let i = 0; i < n; i++) {
      const name = pick(COMMENTER_NAMES);
      await this.prisma.contactMessage.create({
        data: {
          name,
          email: `${name.toLowerCase()}${randInt(1, 999)}${CONTACT_EMAIL_DOMAIN}`,
          subject: pick(CONTACT_SUBJECTS),
          message: `${pick(PARAGRAPHS)} ${pick(PARAGRAPHS)}`,
          status: pick(CONTACT_STATUSES),
          ipAddress: '127.0.0.1',
          userAgent: 'DummySeeder/1.0',
        },
      });
    }
    return n;
  }

  /** Hitung data dummy yang saat ini ada. */
  async stats(): Promise<DummyCounts> {
    const [categories, tags, articles, comments, gallery, liveStreams, venue, contact] =
      await Promise.all([
        this.prisma.category.count({ where: { slug: { startsWith: CATEGORY_PREFIX } } }),
        this.prisma.tag.count({ where: { slug: { startsWith: TAG_PREFIX } } }),
        this.prisma.article.count({ where: { slug: { startsWith: ARTICLE_PREFIX } } }),
        this.prisma.comment.count({
          where: { article: { slug: { startsWith: ARTICLE_PREFIX } } },
        }),
        this.prisma.galleryPhoto.count({
          where: { media: { title: { startsWith: MEDIA_LABEL } } },
        }),
        this.prisma.liveStream.count({
          where: { matchRef: { startsWith: LIVE_MATCHREF_PREFIX } },
        }),
        this.prisma.venueContent.count({
          where: { venueRef: { startsWith: VENUE_REF_PREFIX } },
        }),
        this.prisma.contactMessage.count({
          where: { email: { endsWith: CONTACT_EMAIL_DOMAIN } },
        }),
      ]);
    return { categories, tags, articles, comments, gallery, liveStreams, venue, contact };
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

    // Modul lain (tanpa relasi cascade ke yang di atas).
    await this.prisma.liveStream.deleteMany({
      where: { matchRef: { startsWith: LIVE_MATCHREF_PREFIX } },
    });
    await this.prisma.venueContent.deleteMany({
      where: { venueRef: { startsWith: VENUE_REF_PREFIX } },
    });
    await this.prisma.contactMessage.deleteMany({
      where: { email: { endsWith: CONTACT_EMAIL_DOMAIN } },
    });

    this.logger.log(`dummy.clear ${JSON.stringify(before)}`);
    return before;
  }
}
