/**
 * src/modules/articles/articles.service.ts
 * Aturan bisnis Article: workflow editorial, slug unik, transaksi publish, AuthZ.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ArticleStatus, Prisma, UserRole } from '@prisma/client';
import { nanoid } from 'nanoid';
import { paginate } from '../../common/dto/paginated';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { Paginated } from '../../common/interceptors/response.interceptor';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { slugify } from '../../common/utils/slug';
import { ArticlesRepository } from './articles.repository';
import { CreateArticleDto } from './dto/create-article.dto';
import { PublishArticleDto } from './dto/publish-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import {
  ArticleView,
  ArticleWithRelations,
  toArticleView,
} from './entities/article.entity';

/** Peran yang boleh mengelola artikel milik siapa pun. */
const EDITORIAL_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.EDITOR];

/** Service Article: orkestrasi pembuatan, perubahan, dan publikasi konten. */
@Injectable()
export class ArticlesService {
  private readonly audit = new Logger('Audit');

  constructor(private readonly repo: ArticlesRepository) {}

  /** Buat artikel baru berstatus DRAFT milik pemanggil. */
  async create(dto: CreateArticleDto, user: AuthenticatedUser): Promise<ArticleView> {
    const slug = await this.generateUniqueSlug(dto.title);
    const article = await this.repo.create({
      slug,
      title: dto.title,
      body: dto.body as Prisma.InputJsonValue,
      excerpt: dto.excerpt,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      author: { connect: { id: user.id } },
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      featuredMedia: dto.featuredMediaId
        ? { connect: { id: dto.featuredMediaId } }
        : undefined,
      tags: dto.tagIds?.length
        ? { create: dto.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
        : undefined,
    });
    return toArticleView(article);
  }

  /** Ubah artikel; hanya pemilik atau editor ke atas. */
  async update(
    id: string,
    dto: UpdateArticleDto,
    user: AuthenticatedUser,
  ): Promise<ArticleView> {
    const current = await this.getEntityOrFail(id);
    this.assertCanManage(current, user);

    const data: Prisma.ArticleUpdateInput = {
      title: dto.title,
      body: dto.body as Prisma.InputJsonValue | undefined,
      excerpt: dto.excerpt,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      featuredMedia: dto.featuredMediaId
        ? { connect: { id: dto.featuredMediaId } }
        : undefined,
      tags: dto.tagIds
        ? {
            deleteMany: {},
            create: dto.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    };
    return toArticleView(await this.repo.update(id, data));
  }

  /** Ajukan artikel untuk review (DRAFT -> IN_REVIEW). */
  async submit(id: string, user: AuthenticatedUser): Promise<ArticleView> {
    const current = await this.getEntityOrFail(id);
    this.assertCanManage(current, user);
    if (current.status !== ArticleStatus.DRAFT) {
      throw new ConflictError('Hanya draft yang bisa diajukan review.');
    }
    return toArticleView(
      await this.repo.update(id, { status: ArticleStatus.IN_REVIEW }),
    );
  }

  /** Publikasikan/jadwalkan artikel (editor ke atas); simpan revisi dalam transaksi. */
  async publish(
    id: string,
    dto: PublishArticleDto,
    user: AuthenticatedUser,
  ): Promise<ArticleView> {
    const current = await this.getEntityOrFail(id);
    if (current.status === ArticleStatus.ARCHIVED) {
      throw new ConflictError('Artikel terarsip tidak bisa dipublikasikan.');
    }
    const when = dto.publishedAt ? new Date(dto.publishedAt) : new Date();
    const status =
      when.getTime() > Date.now()
        ? ArticleStatus.SCHEDULED
        : ArticleStatus.PUBLISHED;

    const snapshot: Prisma.InputJsonValue = {
      title: current.title,
      excerpt: current.excerpt,
      body: current.body as Prisma.InputJsonValue,
      seoTitle: current.seoTitle,
      seoDescription: current.seoDescription,
      status: current.status,
    };
    const published = await this.repo.publishWithRevision(
      id,
      status,
      when,
      user.id,
      snapshot,
    );
    this.audit.log(
      `article.publish id=${id} status=${status} by=${user.id}`,
    );
    return toArticleView(published);
  }

  /** Arsipkan artikel (editor ke atas atau pemilik). */
  async archive(id: string, user: AuthenticatedUser): Promise<ArticleView> {
    const current = await this.getEntityOrFail(id);
    this.assertCanManage(current, user);
    return toArticleView(
      await this.repo.update(id, { status: ArticleStatus.ARCHIVED }),
    );
  }

  /** Daftar artikel publik (hanya PUBLISHED); pakai FTS bila ada kata kunci. */
  async listPublic(query: {
    page: number;
    perPage: number;
    category?: string;
    tag?: string;
    q?: string;
  }): Promise<Paginated<ArticleView>> {
    const skip = (query.page - 1) * query.perPage;
    const filter = {
      status: ArticleStatus.PUBLISHED,
      categorySlug: query.category,
      tagSlug: query.tag,
    };
    const [rows, total] = query.q
      ? await this.repo.searchPublished(query.q, filter, skip, query.perPage)
      : await this.repo.paginate(filter, skip, query.perPage);
    return paginate(rows.map(toArticleView), total, query.page, query.perPage);
  }

  /** Ambil satu artikel publik via slug + naikkan view. */
  async getPublicBySlug(slug: string): Promise<ArticleView> {
    const article = await this.repo.findPublishedBySlug(slug);
    if (!article) throw new NotFoundError('Artikel tidak ditemukan.');
    await this.repo.incrementView(article.id);
    return toArticleView({ ...article, viewCount: article.viewCount + 1 });
  }

  /** Daftar artikel untuk staf: editor lihat semua, penulis hanya miliknya. */
  async listManage(
    query: { page: number; perPage: number; status?: ArticleStatus; category?: string; tag?: string },
    user: AuthenticatedUser,
  ): Promise<Paginated<ArticleView>> {
    const skip = (query.page - 1) * query.perPage;
    const [rows, total] = await this.repo.paginate(
      {
        status: query.status,
        categorySlug: query.category,
        tagSlug: query.tag,
        authorId: EDITORIAL_ROLES.includes(user.role) ? undefined : user.id,
      },
      skip,
      query.perPage,
    );
    return paginate(rows.map(toArticleView), total, query.page, query.perPage);
  }

  /** Buat slug unik dari judul; tambahkan akhiran acak bila bentrok. */
  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title) || 'artikel';
    if (!(await this.repo.slugExists(base))) return base;
    return `${base}-${nanoid(6).toLowerCase()}`;
  }

  /** Pastikan artikel ada atau lempar NotFound. */
  private async getEntityOrFail(id: string): Promise<ArticleWithRelations> {
    const article = await this.repo.findById(id);
    if (!article) throw new NotFoundError('Artikel tidak ditemukan.');
    return article;
  }

  /** AuthZ: editor ke atas boleh semua; selain itu hanya pemilik. */
  private assertCanManage(
    article: ArticleWithRelations,
    user: AuthenticatedUser,
  ): void {
    const isEditorial = EDITORIAL_ROLES.includes(user.role);
    if (!isEditorial && article.authorId !== user.id) {
      throw new ForbiddenError('Anda bukan pemilik artikel ini.');
    }
  }
}
