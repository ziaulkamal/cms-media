/**
 * prisma/seed.ts
 * Seed idempoten: admin pertama (argon2) + kategori dasar. Aman dijalankan berulang.
 */
import { PrismaClient, SettingType, UserRole } from '@prisma/client';
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

/** Buat admin pertama dari env (password di-hash, tidak pernah plaintext). */
async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@cms-media.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345!';
  const name = process.env.SEED_ADMIN_NAME ?? 'Administrator';
  const passwordHash = await argon2.hash(password);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, role: UserRole.ADMIN },
  });
  console.log(`✓ Admin siap: ${email}`);
}

/** Buat rubrik dasar agar artikel pertama punya kategori. */
async function seedCategories(): Promise<void> {
  const names = ['Ekonomi', 'Market', 'Tech', 'Lifestyle', 'News'];
  for (const name of names) {
    const slug = toSlug(name);
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, name },
    });
  }
  console.log(`✓ Kategori dasar siap: ${names.join(', ')}`);
}

/** Buat setting situs dasar (SEO/meta) yang bisa dibaca publik. */
async function seedSettings(): Promise<void> {
  const settings = [
    { key: 'site_url', value: 'https://cms-media.local', type: SettingType.URL, group: 'general', label: 'URL Situs' },
    { key: 'site_title', value: 'CMS Media', type: SettingType.STRING, group: 'seo', label: 'Judul Situs' },
    { key: 'site_description', value: 'Portal berita ekonomi, pasar, dan teknologi.', type: SettingType.TEXT, group: 'seo', label: 'Deskripsi Situs' },
    { key: 'site_keywords', value: 'berita, ekonomi, pasar, teknologi', type: SettingType.STRING, group: 'seo', label: 'Keyword Situs' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, isPublic: true },
    });
  }
  console.log(`✓ Setting situs dasar siap: ${settings.map((s) => s.key).join(', ')}`);
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedCategories();
  await seedSettings();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
