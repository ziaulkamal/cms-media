/**
 * prisma/seed.ts
 * Seed idempoten: akun multi-role + taksonomi + artikel/komentar/iklan/setting dummy.
 * Aman dijalankan berulang (upsert by unique key; data tanpa unique key dijaga via count).
 */
import {
  AdCreativeKind,
  AdCreativeStatus,
  AdPlatform,
  ArticleStatus,
  CommentStatus,
  MenuLinkType,
  MenuLocation,
  PageStatus,
  Prisma,
  PrismaClient,
  SettingType,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/** Slug sederhana untuk kebutuhan seed (hindari dependensi src/). */
const toSlug = (s: string): string =>
  s
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Bangun body artikel berformat dokumen TipTap dari paragraf teks. */
function doc(...paragraphs: string[]): Prisma.InputJsonValue {
  return {
    type: 'doc',
    content: paragraphs.map((p) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: p }],
    })),
  };
}

/** Akun staf untuk tiap peran (password dev seragam kecuali admin dari env). */
async function seedUsers(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@cms-media.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345!';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Administrator';

  const accounts = [
    { email: adminEmail, name: adminName, password: adminPassword, role: UserRole.ADMIN },
    { email: 'editor@cms-media.local', name: 'Erika Editor', password: 'Editor12345!', role: UserRole.EDITOR },
    { email: 'author@cms-media.local', name: 'Andi Author', password: 'Author12345!', role: UserRole.AUTHOR },
    { email: 'kontributor@cms-media.local', name: 'Kiki Kontributor', password: 'Kontrib12345!', role: UserRole.CONTRIBUTOR },
  ];

  for (const acc of accounts) {
    const passwordHash = await argon2.hash(acc.password);
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {},
      create: { email: acc.email, name: acc.name, passwordHash, role: acc.role },
    });
  }
  console.log('✓ Akun siap (admin/editor/author/kontributor).');
}

/** Rubrik induk + anak (hierarki rubrik) + kategori default "article". */
async function seedCategories(): Promise<void> {
  // Kategori bawaan untuk artikel tanpa kategori (terproteksi, selalu di akar).
  await prisma.category.upsert({
    where: { slug: 'article' },
    update: { isDefault: true, parentId: null },
    create: { slug: 'article', name: 'Article', isDefault: true, position: 0 },
  });

  const parents = ['Ekonomi', 'Market', 'Tech', 'Lifestyle', 'News'];
  for (const [i, name] of parents.entries()) {
    await prisma.category.upsert({
      where: { slug: toSlug(name) },
      update: { position: i + 1 },
      create: { slug: toSlug(name), name, position: i + 1 },
    });
  }

  const children: Array<{ name: string; parent: string }> = [
    { name: 'Makroekonomi', parent: 'Ekonomi' },
    { name: 'UMKM', parent: 'Ekonomi' },
    { name: 'Saham', parent: 'Market' },
    { name: 'Kripto', parent: 'Market' },
    { name: 'Gadget', parent: 'Tech' },
    { name: 'AI', parent: 'Tech' },
  ];
  // Posisi anak dihitung per induk (0,1,2,...).
  const posByParent = new Map<string, number>();
  for (const c of children) {
    const parent = await prisma.category.findUnique({ where: { slug: toSlug(c.parent) } });
    const pos = posByParent.get(c.parent) ?? 0;
    posByParent.set(c.parent, pos + 1);
    await prisma.category.upsert({
      where: { slug: toSlug(c.name) },
      update: { position: pos },
      create: { slug: toSlug(c.name), name: c.name, parentId: parent?.id, position: pos },
    });
  }
  console.log('✓ Kategori (default + induk + anak) siap.');
}

/** Tag dasar. */
async function seedTags(): Promise<void> {
  const names = ['Inflasi', 'BI Rate', 'Startup', 'IHSG', 'Bitcoin', 'Pemilu', 'Gawai', 'OpenAI'];
  for (const name of names) {
    await prisma.tag.upsert({
      where: { slug: toSlug(name) },
      update: {},
      create: { slug: toSlug(name), name },
    });
  }
  console.log('✓ Tag dasar siap.');
}

/** Artikel beragam status + relasi kategori/tag/penulis. */
async function seedArticles(): Promise<void> {
  const users = await prisma.user.findMany();
  const byEmail = (e: string) => users.find((u) => u.email.startsWith(e))!.id;

  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 86_400_000);
  const daysAhead = (n: number) => new Date(now + n * 86_400_000);

  const articles: Array<{
    title: string;
    status: ArticleStatus;
    categorySlug: string;
    tagSlugs: string[];
    author: string;
    publishedAt?: Date;
    excerpt: string;
  }> = [
    { title: 'Inflasi Melandai, BI Tahan Suku Bunga', status: ArticleStatus.PUBLISHED, categorySlug: 'makroekonomi', tagSlugs: ['inflasi', 'bi-rate'], author: 'editor', publishedAt: daysAgo(1), excerpt: 'Bank sentral menahan suku bunga acuan di tengah pelandaian inflasi.' },
    { title: 'IHSG Ditutup Menguat ke Level Tertinggi', status: ArticleStatus.PUBLISHED, categorySlug: 'saham', tagSlugs: ['ihsg'], author: 'author', publishedAt: daysAgo(2), excerpt: 'Indeks harga saham gabungan mencatat rekor baru hari ini.' },
    { title: 'Bitcoin Kembali Tembus Resistance Kunci', status: ArticleStatus.PUBLISHED, categorySlug: 'kripto', tagSlugs: ['bitcoin'], author: 'author', publishedAt: daysAgo(4), excerpt: 'Harga Bitcoin menembus level psikologis setelah arus masuk ETF.' },
    { title: 'Startup Lokal Raih Pendanaan Seri B', status: ArticleStatus.PUBLISHED, categorySlug: 'tech', tagSlugs: ['startup'], author: 'editor', publishedAt: daysAgo(7), excerpt: 'Pendanaan dipimpin investor global untuk ekspansi regional.' },
    { title: 'Tren Gawai Lipat di 2026', status: ArticleStatus.PUBLISHED, categorySlug: 'gadget', tagSlugs: ['gawai'], author: 'author', publishedAt: daysAgo(10), excerpt: 'Pabrikan berlomba menghadirkan layar lipat lebih tahan lama.' },
    { title: 'OpenAI Rilis Model Terbaru untuk Enterprise', status: ArticleStatus.IN_REVIEW, categorySlug: 'ai', tagSlugs: ['openai', 'startup'], author: 'kontributor', excerpt: 'Model baru menyasar kebutuhan korporasi dengan fokus keamanan.' },
    { title: 'Panduan UMKM Hadapi Musim Pajak', status: ArticleStatus.DRAFT, categorySlug: 'umkm', tagSlugs: [], author: 'kontributor', excerpt: 'Langkah praktis menyiapkan laporan keuangan sederhana.' },
    { title: 'Agenda Ekonomi Pekan Depan', status: ArticleStatus.SCHEDULED, categorySlug: 'ekonomi', tagSlugs: ['bi-rate'], author: 'editor', publishedAt: daysAhead(2), excerpt: 'Sederet rilis data dan keputusan suku bunga dinanti pasar.' },
    { title: 'Arsip: Retrospektif Pasar Tahun Lalu', status: ArticleStatus.ARCHIVED, categorySlug: 'market', tagSlugs: ['ihsg'], author: 'editor', publishedAt: daysAgo(120), excerpt: 'Tinjauan kinerja pasar sepanjang tahun sebelumnya.' },
  ];

  for (const a of articles) {
    const slug = toSlug(a.title);
    const category = await prisma.category.findUnique({ where: { slug: a.categorySlug } });
    const article = await prisma.article.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: a.title,
        excerpt: a.excerpt,
        body: doc(a.excerpt, 'Isi lengkap artikel ditulis di sini sebagai contoh konten dummy untuk pengembangan.'),
        status: a.status,
        authorId: byEmail(a.author),
        categoryId: category?.id,
        publishedAt: a.publishedAt,
        seoTitle: a.title,
        seoDescription: a.excerpt,
        viewCount: Math.floor(Math.random() * 5000),
      },
    });

    for (const tagSlug of a.tagSlugs) {
      const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
      if (tag) {
        await prisma.articleTag.upsert({
          where: { articleId_tagId: { articleId: article.id, tagId: tag.id } },
          update: {},
          create: { articleId: article.id, tagId: tag.id },
        });
      }
    }
  }
  console.log(`✓ ${articles.length} artikel dummy siap (beragam status).`);
}

/** Komentar pada artikel terbit (hanya bila belum ada — jaga idempoten). */
async function seedComments(): Promise<void> {
  if ((await prisma.comment.count()) > 0) {
    console.log('• Komentar sudah ada, dilewati.');
    return;
  }
  const target = await prisma.article.findFirst({ where: { status: ArticleStatus.PUBLISHED } });
  if (!target) return;

  await prisma.comment.createMany({
    data: [
      { articleId: target.id, authorName: 'Budi', body: 'Artikel yang informatif, terima kasih!', status: CommentStatus.APPROVED },
      { articleId: target.id, authorName: 'Sinta', body: 'Mohon dibahas dampaknya ke UMKM.', status: CommentStatus.PENDING },
      { articleId: target.id, authorName: 'Promo', body: 'Kunjungi situs saya untuk diskon!!!', status: CommentStatus.SPAM },
      { articleId: target.id, authorName: 'Dewi', body: 'Datanya dari sumber mana ya?', status: CommentStatus.PENDING },
    ],
  });
  console.log('✓ Komentar dummy siap (approved/pending/spam).');
}

/** Slot iklan + creative contoh per kind (idempoten). */
async function seedAds(): Promise<void> {
  const slots = [
    { key: 'home_top', name: 'Home — Atas', width: 970, height: 250, isAmpEnabled: true },
    { key: 'article_inline', name: 'Artikel — Inline', width: 336, height: 280, isAmpEnabled: true },
    { key: 'sidebar_300x250', name: 'Sidebar — Medium Rectangle', width: 300, height: 250, isAmpEnabled: false },
  ];
  for (const s of slots) {
    await prisma.adSlot.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, isActive: true },
    });
  }

  if ((await prisma.adCreative.count()) === 0) {
    const homeTop = await prisma.adSlot.findUnique({ where: { key: 'home_top' } });
    const inline = await prisma.adSlot.findUnique({ where: { key: 'article_inline' } });
    const sidebar = await prisma.adSlot.findUnique({ where: { key: 'sidebar_300x250' } });

    await prisma.adCreative.createMany({
      data: [
        {
          slotId: homeTop!.id,
          kind: AdCreativeKind.HOUSE_IMAGE,
          platform: AdPlatform.BOTH,
          status: AdCreativeStatus.ACTIVE,
          name: 'House Banner — Promo Langganan',
          imageUrl: 'https://placehold.co/970x250',
          targetUrl: 'https://cms-media.local/langganan',
          alt: 'Promo langganan premium',
          priority: 10,
        },
        {
          slotId: inline!.id,
          kind: AdCreativeKind.ADSENSE,
          platform: AdPlatform.WEB,
          status: AdCreativeStatus.ACTIVE,
          name: 'AdSense — Inline',
          adClient: 'ca-pub-1234567890123456',
          adSlot: '1234567890',
          adFormat: 'auto',
          priority: 5,
        },
        {
          slotId: sidebar!.id,
          kind: AdCreativeKind.HOUSE_HTML,
          platform: AdPlatform.WEB,
          status: AdCreativeStatus.PAUSED,
          name: 'HTML Custom — Sidebar',
          htmlSnippet: '<div style="text-align:center">Iklan HTML kustom</div>',
          priority: 1,
        },
      ],
    });
    console.log('✓ Creative iklan dummy siap (image/adsense/html).');
  } else {
    console.log('• Creative iklan sudah ada, dilewati.');
  }
  console.log('✓ Slot iklan siap.');
}

/** Setting situs (SEO/meta + beberapa tipe untuk demo SettingField). */
async function seedSettings(): Promise<void> {
  const settings = [
    { key: 'site_url', value: 'https://cms-media.local', type: SettingType.URL, group: 'general', label: 'URL Situs (CMS)', isPublic: true },
    { key: 'frontend_url', value: 'http://localhost:5173', type: SettingType.URL, group: 'general', label: 'URL Frontend Publik (PORA)', isPublic: true },
    { key: 'site_title', value: 'CMS Media', type: SettingType.STRING, group: 'seo', label: 'Judul Situs', isPublic: true },
    { key: 'site_description', value: 'Portal berita ekonomi, pasar, dan teknologi.', type: SettingType.TEXT, group: 'seo', label: 'Deskripsi Situs', isPublic: true },
    { key: 'site_keywords', value: 'berita, ekonomi, pasar, teknologi', type: SettingType.STRING, group: 'seo', label: 'Keyword Situs', isPublic: true },
    { key: 'posts_per_page', value: 12, type: SettingType.NUMBER, group: 'general', label: 'Artikel per Halaman', isPublic: false },
    { key: 'comments_enabled', value: true, type: SettingType.BOOLEAN, group: 'general', label: 'Aktifkan Komentar', isPublic: false },
    { key: 'social_twitter', value: 'https://twitter.com/cmsmedia', type: SettingType.URL, group: 'social', label: 'Twitter/X', isPublic: true },

    // FASE 10.A — identitas event PORA (publik; dikonsumsi FE PoraAcehJaya).
    { key: 'event_edisi', value: 'XXI', type: SettingType.STRING, group: 'event', label: 'Edisi Event', isPublic: true },
    { key: 'event_nama_panjang', value: 'Pekan Olahraga Aceh', type: SettingType.STRING, group: 'event', label: 'Nama Panjang Event', isPublic: true },
    { key: 'event_tuan_rumah', value: 'Kabupaten Aceh Jaya', type: SettingType.STRING, group: 'event', label: 'Tuan Rumah', isPublic: true },
    { key: 'event_kota', value: 'Calang', type: SettingType.STRING, group: 'event', label: 'Kota Penyelenggara', isPublic: true },
    { key: 'event_tanggal_mulai', value: '2026-08-01', type: SettingType.STRING, group: 'event', label: 'Tanggal Mulai', isPublic: true },
    { key: 'event_tanggal_selesai', value: '2026-08-12', type: SettingType.STRING, group: 'event', label: 'Tanggal Selesai', isPublic: true },
    { key: 'event_tagline', value: 'Bersatu, Berprestasi, Berjaya', type: SettingType.STRING, group: 'event', label: 'Tagline Event', isPublic: true },

    // FASE 10.A — tautan media sosial (publik).
    { key: 'social_facebook', value: 'https://facebook.com/poraacehjaya', type: SettingType.URL, group: 'social', label: 'Facebook', isPublic: true },
    { key: 'social_instagram', value: 'https://instagram.com/poraacehjaya', type: SettingType.URL, group: 'social', label: 'Instagram', isPublic: true },
    { key: 'social_threads', value: 'https://threads.net/@poraacehjaya', type: SettingType.URL, group: 'social', label: 'Threads', isPublic: true },
    { key: 'social_tiktok', value: 'https://tiktok.com/@poraacehjaya', type: SettingType.URL, group: 'social', label: 'TikTok', isPublic: true },
    { key: 'social_x', value: 'https://x.com/poraacehjaya', type: SettingType.URL, group: 'social', label: 'X (Twitter)', isPublic: true },

    // FASE 10.A — master saklar siaran langsung (publik; dibaca FE & /live-streams).
    { key: 'streaming_enabled', value: false, type: SettingType.BOOLEAN, group: 'streaming', label: 'Aktifkan Siaran Langsung', isPublic: true },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log('✓ Setting situs siap (general/seo/social).');
}

/** Halaman statis wajib (Syarat, Privasi, Daftar Isi) + contoh. */
async function seedPages(): Promise<void> {
  const pages = [
    { title: 'Tentang Kami', mandatory: false },
    { title: 'Syarat & Ketentuan', mandatory: true },
    { title: 'Kebijakan Privasi', mandatory: true },
    { title: 'Kebijakan Cookie', mandatory: true },
    { title: 'Daftar Isi', mandatory: true },
  ];
  for (const p of pages) {
    const slug = toSlug(p.title);
    await prisma.page.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: p.title,
        body: doc(`Halaman ${p.title}.`, 'Konten halaman dapat disunting melalui panel admin.'),
        status: PageStatus.PUBLISHED,
        isMandatory: p.mandatory,
        seoTitle: p.title,
      },
    });
  }
  console.log('✓ Halaman statis siap (Tentang, Syarat, Privasi, Daftar Isi).');
}

/** Pindahkan artikel lama tanpa kategori ke kategori default "article". */
async function backfillDefaultCategory(): Promise<void> {
  const def = await prisma.category.findUnique({ where: { slug: 'article' } });
  if (!def) return;
  const { count } = await prisma.article.updateMany({
    where: { categoryId: null },
    data: { categoryId: def.id },
  });
  if (count > 0) console.log(`✓ ${count} artikel tanpa kategori dipindah ke "article".`);
}

/** Menu WEB (Main, Footer berjenjang, Bawah Footer) dari nama yang sudah ada. */
async function seedMenus(): Promise<void> {
  type Leaf = {
    label: string;
    type: MenuLinkType;
    url?: string | null;
    openInNewTab?: boolean;
  };

  /** Buat item bila belum ada (idempoten by location+parentId+label). */
  async function ensure(
    location: MenuLocation,
    parentId: string | null,
    position: number,
    item: Leaf,
  ): Promise<string> {
    const found = await prisma.menuItem.findFirst({
      where: { location, parentId, label: item.label },
      select: { id: true },
    });
    if (found) return found.id;
    const created = await prisma.menuItem.create({
      data: {
        location,
        parentId,
        position,
        label: item.label,
        type: item.type,
        url: item.url ?? null,
        openInNewTab: item.openInNewTab ?? false,
      },
      select: { id: true },
    });
    return created.id;
  }

  // MAIN (Navbar)
  const main: Leaf[] = [
    { label: 'Beranda', type: MenuLinkType.ANCHOR, url: 'beranda' },
    { label: 'Tentang', type: MenuLinkType.ANCHOR, url: 'tentang' },
    { label: 'Jadwal', type: MenuLinkType.ANCHOR, url: 'jadwal' },
    { label: 'Klasemen', type: MenuLinkType.ANCHOR, url: 'klasemen' },
    { label: 'Venue', type: MenuLinkType.ANCHOR, url: 'venue' },
    { label: 'Berita', type: MenuLinkType.ANCHOR, url: 'berita' },
    { label: 'Galeri', type: MenuLinkType.ROUTE, url: '/galeri' },
  ];
  for (const [i, item] of main.entries()) {
    await ensure(MenuLocation.MAIN, null, i, item);
  }

  // FOOTER (berjenjang: kolom -> item). Kolom = heading tanpa url.
  const footer: Array<{ heading: string; items: Leaf[] }> = [
    {
      heading: 'Event',
      items: [
        { label: 'Tentang PORA', type: MenuLinkType.ANCHOR, url: 'tentang' },
        { label: 'Cabang Olahraga', type: MenuLinkType.ANCHOR, url: 'cabor' },
        { label: 'Jadwal', type: MenuLinkType.ANCHOR, url: 'jadwal' },
        { label: 'Klasemen', type: MenuLinkType.ROUTE, url: '/klasemen' },
      ],
    },
    {
      heading: 'Informasi',
      items: [
        { label: 'Venue & Arena', type: MenuLinkType.ROUTE, url: '/venue' },
        { label: 'Berita', type: MenuLinkType.ROUTE, url: '/berita' },
        { label: 'Live Skor', type: MenuLinkType.ROUTE, url: '/live' },
        { label: 'Galeri', type: MenuLinkType.ROUTE, url: '/galeri' },
      ],
    },
  ];
  for (const [ci, col] of footer.entries()) {
    const colId = await ensure(MenuLocation.FOOTER, null, ci, {
      label: col.heading,
      type: MenuLinkType.ROUTE,
      url: null,
    });
    for (const [ii, item] of col.items.entries()) {
      await ensure(MenuLocation.FOOTER, colId, ii, item);
    }
  }

  // FOOTER_BOTTOM (bar legal di bawah footer)
  const bottom: Leaf[] = [
    { label: 'Kontak', type: MenuLinkType.ROUTE, url: '/kontak' },
    { label: 'Syarat & Ketentuan', type: MenuLinkType.ROUTE, url: '/syarat-ketentuan' },
    { label: 'Kebijakan Cookie', type: MenuLinkType.ROUTE, url: '/kebijakan-cookie' },
    { label: 'Peta Situs', type: MenuLinkType.ROUTE, url: '/sitemap' },
  ];
  for (const [i, item] of bottom.entries()) {
    await ensure(MenuLocation.FOOTER_BOTTOM, null, i, item);
  }

  console.log('✓ Menu (Main + Footer berjenjang + Bawah Footer) siap.');
}

async function main(): Promise<void> {
  await seedUsers();
  await seedCategories();
  await seedTags();
  await seedArticles();
  await backfillDefaultCategory();
  await seedComments();
  await seedAds();
  await seedSettings();
  await seedPages();
  await seedMenus();
  console.log('\nSeed selesai. Login admin: lihat SEED_ADMIN_* di .env.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
