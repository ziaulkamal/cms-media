/**
 * admin/src/types/cms.ts
 * Kontrak tipe SPA <-> API: envelope, enums, entity view, dan payload request.
 * Tanggal datang sebagai string ISO-8601 dari JSON.
 */

// ============================================================
// Envelope & paginasi
// ============================================================

/** Meta paginasi pada response list. */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/** Envelope sukses backend: { success, data, meta? }. */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

/** Envelope error backend: { success:false, error, requestId }. */
export interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
  requestId?: string;
}

/** Hasil list yang sudah dipisah jadi item + meta untuk dipakai komponen. */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

// ============================================================
// Enums (string union + daftar untuk select)
// ============================================================

export type UserRole = 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'CONTRIBUTOR';
export const USER_ROLES: UserRole[] = ['ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR'];

export type ArticleStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED';
export const ARTICLE_STATUSES: ArticleStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
];

export type CommentStatus = 'PENDING' | 'APPROVED' | 'SPAM';
export const COMMENT_STATUSES: CommentStatus[] = ['PENDING', 'APPROVED', 'SPAM'];

export type AdCreativeKind = 'HOUSE_IMAGE' | 'HOUSE_HTML' | 'ADSENSE';
export const AD_CREATIVE_KINDS: AdCreativeKind[] = [
  'HOUSE_IMAGE',
  'HOUSE_HTML',
  'ADSENSE',
];

export type AdPlatform = 'WEB' | 'AMP' | 'BOTH';
export const AD_PLATFORMS: AdPlatform[] = ['WEB', 'AMP', 'BOTH'];

export type AdCreativeStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'EXPIRED'
  | 'ARCHIVED';
export const AD_CREATIVE_STATUSES: AdCreativeStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'ARCHIVED',
];

export type PageStatus = 'DRAFT' | 'PUBLISHED';
export const PAGE_STATUSES: PageStatus[] = ['DRAFT', 'PUBLISHED'];

export type SettingType =
  | 'STRING'
  | 'TEXT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'JSON'
  | 'URL';
export const SETTING_TYPES: SettingType[] = [
  'STRING',
  'TEXT',
  'NUMBER',
  'BOOLEAN',
  'JSON',
  'URL',
];

export type PhotoOrientation = 'POTRET' | 'LANSKAP' | 'KOTAK';
export const PHOTO_ORIENTATIONS: PhotoOrientation[] = [
  'POTRET',
  'LANSKAP',
  'KOTAK',
];

export type ContactStatus = 'NEW' | 'READ' | 'REPLIED' | 'SPAM' | 'ARCHIVED';
export const CONTACT_STATUSES: ContactStatus[] = [
  'NEW',
  'READ',
  'REPLIED',
  'SPAM',
  'ARCHIVED',
];

// ============================================================
// Entity views (bentuk yang dikembalikan API)
// ============================================================

/** Staf/pengguna internal. */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

/** Rubrik/kategori (flat; hierarki dirakit di client via parentId). */
export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  /** Urutan tampil di antara saudara (diatur via drag-and-drop). */
  position: number;
  /** Kategori bawaan untuk artikel tanpa kategori (terproteksi). */
  isDefault: boolean;
  /** Jumlah artikel yang memakai kategori ini. */
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Satu simpul susunan baru pohon kategori (payload reorder). */
export interface ReorderCategoryItem {
  id: string;
  parentId: string | null;
  position: number;
}

/** Label/tag. */
export interface Tag {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
}

/** Aset media. */
export interface Media {
  id: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  title: string | null;
  description: string | null;
  alt: string | null;
  createdAt: string;
}

/** Metadata media yang bisa diubah (SEO). */
export interface UpdateMediaPayload {
  title?: string;
  description?: string;
  alt?: string;
}

/** Relasi ringkas pada artikel. */
export interface ArticleAuthorRef {
  id: string;
  name: string;
}
export interface ArticleTermRef {
  id: string;
  slug: string;
  name: string;
}
export interface ArticleFeaturedMedia {
  id: string;
  url: string;
  alt: string | null;
}

/** Artikel lengkap (view manajemen). */
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: unknown;
  status: ArticleStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  author: ArticleAuthorRef;
  category: ArticleTermRef | null;
  tags: ArticleTermRef[];
  featuredMedia: ArticleFeaturedMedia | null;
}

/** Ringkasan artikel asal komentar. */
export interface CommentArticleRef {
  id: string;
  title: string;
  slug: string;
}

/** Komentar untuk panel moderasi. */
export interface CommentModeration {
  id: string;
  articleId: string;
  userId: string | null;
  parentId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  status: CommentStatus;
  likeCount: number;
  createdAt: string;
  article: CommentArticleRef | null;
}

/** Rekap jumlah komentar per status (header moderasi). */
export interface CommentModerationStats {
  total: number;
  pending: number;
  approved: number;
  spam: number;
}

/** Slot iklan (posisi bernama). */
export interface AdSlot {
  id: string;
  key: string;
  name: string;
  description: string | null;
  width: number | null;
  height: number | null;
  isAmpEnabled: boolean;
  isActive: boolean;
  createdAt: string;
}

/** Materi iklan (field aktif berbeda per kind). */
export interface AdCreative {
  id: string;
  slotId: string;
  kind: AdCreativeKind;
  platform: AdPlatform;
  status: AdCreativeStatus;
  name: string;
  imageUrl: string | null;
  targetUrl: string | null;
  alt: string | null;
  htmlSnippet: string | null;
  adClient: string | null;
  adSlot: string | null;
  adFormat: string | null;
  width: number | null;
  height: number | null;
  priority: number;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}

/** Halaman statis (terpisah dari Article). */
export interface Page {
  id: string;
  slug: string;
  title: string;
  body: unknown;
  status: PageStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Setting (konfigurasi situs dinamis). */
export interface Setting {
  id: string;
  key: string;
  value: unknown;
  type: SettingType;
  group: string;
  label: string | null;
  isPublic: boolean;
  updatedAt: string;
}

// ============================================================
// Payload request (body / query)
// ============================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ArticleQuery {
  page?: number;
  perPage?: number;
  status?: ArticleStatus;
  category?: string;
  tag?: string;
  q?: string;
}

export interface CreateArticlePayload {
  title: string;
  body: Record<string, unknown>;
  excerpt?: string;
  categoryId?: string;
  featuredMediaId?: string;
  tagIds?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}
export type UpdateArticlePayload = Partial<CreateArticlePayload>;

export interface PublishArticlePayload {
  /** ISO-8601; kosong = terbit sekarang, masa depan = SCHEDULED. */
  publishedAt?: string;
}

export interface CreateCategoryPayload {
  name: string;
  /** Slug kustom; kosong = diturunkan dari nama. */
  slug?: string;
  parentId?: string;
}
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface CreateTagPayload {
  name: string;
}

// ── Menu WEB ──────────────────────────────────────────────────────────────
export type MenuLocation = 'MAIN' | 'FOOTER' | 'FOOTER_BOTTOM';
export type MenuLinkType = 'ANCHOR' | 'ROUTE' | 'EXTERNAL';

export interface MenuItem {
  id: string;
  location: MenuLocation;
  parentId: string | null;
  label: string;
  type: MenuLinkType;
  /** Nilai tautan; null untuk judul kolom footer. */
  url: string | null;
  openInNewTab: boolean;
  position: number;
  isVisible: boolean;
}

/** Node menu berjenjang (kolom footer -> item). */
export interface MenuNode extends MenuItem {
  children: MenuNode[];
}

export interface CreateMenuItemPayload {
  location: MenuLocation;
  parentId?: string;
  label: string;
  type?: MenuLinkType;
  url?: string | null;
  openInNewTab?: boolean;
  isVisible?: boolean;
}

export interface UpdateMenuItemPayload {
  label?: string;
  type?: MenuLinkType;
  url?: string | null;
  openInNewTab?: boolean;
  isVisible?: boolean;
}

/** Satu simpul susunan baru pohon menu (payload reorder). */
export interface ReorderMenuItem {
  id: string;
  parentId: string | null;
  position: number;
}

// ── Sosial media ────────────────────────────────────────────────────────────
export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'x'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'whatsapp'
  | 'telegram'
  | 'website'
  | 'email';

/** Satu tautan sosial media (platform + URL + aktif). */
export interface SocialLink {
  platform: SocialPlatform | string;
  url: string;
  enabled: boolean;
}

export interface CreateAdSlotPayload {
  key: string;
  name: string;
  description?: string;
  width?: number;
  height?: number;
  isAmpEnabled?: boolean;
  isActive?: boolean;
}
export type UpdateAdSlotPayload = Partial<Omit<CreateAdSlotPayload, 'key'>>;

export interface CreateAdCreativePayload {
  kind: AdCreativeKind;
  platform?: AdPlatform;
  status?: AdCreativeStatus;
  name: string;
  imageUrl?: string;
  targetUrl?: string;
  alt?: string;
  htmlSnippet?: string;
  adClient?: string;
  adSlot?: string;
  adFormat?: string;
  width?: number;
  height?: number;
  priority?: number;
  startAt?: string;
  endAt?: string;
}
export type UpdateAdCreativePayload = Partial<CreateAdCreativePayload>;

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}
export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

/** Admin menetapkan password spesifik untuk user. */
export interface SetPasswordPayload {
  password: string;
}

/** Ganti password mandiri (butuh password lama). */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Hasil reset password oleh admin (plaintext sekali tampil). */
export interface ResetPasswordResult {
  user: User;
  password: string;
}

export interface UpsertSettingPayload {
  value?: unknown;
  type?: SettingType;
  group?: string;
  label?: string;
  isPublic?: boolean;
}

export interface ModerationQuery {
  status?: CommentStatus;
  articleId?: string;
  page?: number;
  perPage?: number;
}

export interface PageQuery {
  page?: number;
  perPage?: number;
  status?: PageStatus;
}

export interface CreatePagePayload {
  title: string;
  body: Record<string, unknown>;
  slug?: string;
  status?: PageStatus;
  seoTitle?: string;
  seoDescription?: string;
  isMandatory?: boolean;
}
export type UpdatePagePayload = Partial<CreatePagePayload>;

// ============================================================
// FASE 10 — Gallery, Contact, LiveStream, VenueContent
// ============================================================

/** Foto galeri (view admin lengkap). */
export interface GalleryPhoto {
  id: string;
  mediaId: string;
  src: string;
  caption: string | null;
  category: string | null;
  orientation: PhotoOrientation;
  albumId: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

/** Album galeri (ringkas: cover + jumlah foto). */
export interface GalleryAlbum {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  photoCount: number;
  createdAt: string;
}

export interface CreateGalleryPhotoPayload {
  mediaId: string;
  caption?: string;
  category?: string;
  orientation?: PhotoOrientation;
  albumId?: string;
  sortOrder?: number;
  isPublished?: boolean;
}
export type UpdateGalleryPhotoPayload = Partial<
  Omit<CreateGalleryPhotoPayload, 'mediaId'>
>;

export interface CreateAlbumPayload {
  title: string;
  coverMediaId?: string;
}
export type UpdateAlbumPayload = Partial<CreateAlbumPayload>;

/** Pesan kontak (inbox admin). */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/** Rekap jumlah pesan kontak per status. */
export interface ContactStats {
  total: number;
  new: number;
  read: number;
  replied: number;
  spam: number;
  archived: number;
}

export interface ContactQuery {
  page?: number;
  perPage?: number;
  status?: ContactStatus;
}

/** Kanal siaran langsung (view admin lengkap). */
export interface LiveStream {
  id: string;
  youtubeId: string;
  sportName: string | null;
  matchRef: string | null;
  title: string;
  venueName: string | null;
  viewerCount: number;
  isLive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLiveStreamPayload {
  /** URL YouTube (di-paste) atau video id; dinormalkan di backend. */
  youtube: string;
  title: string;
  sportName?: string;
  matchRef?: string;
  venueName?: string;
  sortOrder?: number;
  isLive?: boolean;
  isFeatured?: boolean;
}
export type UpdateLiveStreamPayload = Partial<CreateLiveStreamPayload>;

/** Opsi pertandingan dari CORE untuk penaut kanal streaming. */
export interface MatchOption {
  ref: string;
  code: string;
  label: string;
  sportName: string | null;
  venueName: string | null;
  status: string;
}

/** Konten pengayaan venue. */
export interface VenueContent {
  id: string;
  venueRef: string;
  description: string;
  imageUrl: string | null;
  gallery: unknown;
  galleryVisible: boolean;
  updatedAt: string;
}

export interface UpsertVenueContentPayload {
  venueRef: string;
  description: string;
  imageMediaId?: string;
  gallery?: unknown[];
  galleryVisible?: boolean;
}

/** Hasil proxy daftar venue dari simpora2026. */
export interface VenueSources {
  available: boolean;
  venues: unknown[];
}

/** Jumlah data dummy (hasil generate / yang tersisa). */
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

// ============================================================
// Dashboard (ringkasan agregasi)
// ============================================================

/** Hitungan KPI utama dashboard. */
export interface DashboardCounts {
  articles: number;
  published: number;
  draft: number;
  pages: number;
  media: number;
  users: number;
  galleryPhotos: number;
  pendingComments: number;
  newContacts: number;
  liveActive: number;
}

/** Satu irisan komposisi konten (untuk donut). */
export interface DashboardCompositionItem {
  key: string;
  label: string;
  value: number;
}

/** Deret tren publikasi harian. */
export interface DashboardTrend {
  labels: string[];
  values: number[];
}

/** Komentar menunggu pada antrean "butuh aksi". */
export interface DashboardCommentFeed {
  id: string;
  authorName: string | null;
  body: string;
  createdAt: string;
  article: { id: string; title: string; slug: string } | null;
}

/** Pesan kontak baru pada antrean "butuh aksi". */
export interface DashboardContactFeed {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
}

/** Kanal live yang sedang aktif. */
export interface DashboardLiveFeed {
  id: string;
  title: string;
  sportName: string | null;
  viewerCount: number;
}

/** Artikel terpopuler (leaderboard by views). */
export interface DashboardTopArticle {
  id: string;
  title: string;
  viewCount: number;
}

/** Ringkasan lengkap dashboard dari GET /dashboard/stats. */
export interface DashboardStats {
  counts: DashboardCounts;
  composition: DashboardCompositionItem[];
  trend: DashboardTrend;
  feed: {
    comments: DashboardCommentFeed[];
    contacts: DashboardContactFeed[];
    liveStreams: DashboardLiveFeed[];
  };
  topArticles: DashboardTopArticle[];
}

/** Pilihan generate data dummy (per-jenis). */
export interface GenerateDummyPayload {
  categories?: boolean;
  tags?: boolean;
  articles?: number;
  comments?: boolean;
  gallery?: number;
  liveStreams?: number;
  venue?: number;
  contact?: number;
}
