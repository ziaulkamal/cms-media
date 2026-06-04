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
  createdAt: string;
  updatedAt: string;
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

/** Komentar untuk panel moderasi. */
export interface CommentModeration {
  id: string;
  articleId: string;
  userId: string | null;
  authorName: string | null;
  body: string;
  status: CommentStatus;
  createdAt: string;
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
  parentId?: string;
}
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface CreateTagPayload {
  name: string;
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
