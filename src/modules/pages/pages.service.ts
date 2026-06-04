/**
 * src/modules/pages/pages.service.ts
 * Aturan bisnis Page: slug unik, halaman wajib tak terhapus, paginasi.
 */
import { Injectable } from '@nestjs/common';
import { PageStatus, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';
import { paginate } from '../../common/dto/paginated';
import { ConflictError, NotFoundError } from '../../common/errors/domain-error';
import { Paginated } from '../../common/interceptors/response.interceptor';
import { slugify } from '../../common/utils/slug';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PageView, toPageView } from './entities/page.entity';
import { PagesRepository } from './pages.repository';

/** Service Page: pengelolaan halaman statis. */
@Injectable()
export class PagesService {
  constructor(private readonly repo: PagesRepository) {}

  /** Buat halaman; slug dari field slug atau judul, dijamin unik. */
  async create(dto: CreatePageDto): Promise<PageView> {
    const slug = await this.uniqueSlug(dto.slug || dto.title);
    const page = await this.repo.create({
      slug,
      title: dto.title,
      body: dto.body as Prisma.InputJsonValue,
      status: dto.status ?? PageStatus.DRAFT,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      isMandatory: dto.isMandatory ?? false,
    });
    return toPageView(page);
  }

  /** Ubah halaman; bila slug diubah, jaga keunikan (kecuali dirinya). */
  async update(id: string, dto: UpdatePageDto): Promise<PageView> {
    await this.getOrFail(id);
    const data: Prisma.PageUpdateInput = {
      title: dto.title,
      body: dto.body as Prisma.InputJsonValue | undefined,
      status: dto.status,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      isMandatory: dto.isMandatory,
    };
    if (dto.slug) data.slug = await this.uniqueSlug(dto.slug, id);
    return toPageView(await this.repo.update(id, data));
  }

  /** Daftar halaman (admin) ter-paginasi. */
  async list(
    page: number,
    perPage: number,
    status?: PageStatus,
  ): Promise<Paginated<PageView>> {
    const [rows, total] = await this.repo.paginate(
      status,
      (page - 1) * perPage,
      perPage,
    );
    return paginate(rows.map(toPageView), total, page, perPage);
  }

  /** Ambil satu halaman (admin) atau lempar NotFound. */
  async getById(id: string): Promise<PageView> {
    return toPageView(await this.getOrFail(id));
  }

  /** Ambil halaman publik via slug (hanya PUBLISHED). */
  async getPublicBySlug(slug: string): Promise<PageView> {
    const page = await this.repo.findPublishedBySlug(slug);
    if (!page) throw new NotFoundError('Halaman tidak ditemukan.');
    return toPageView(page);
  }

  /** Hapus halaman; halaman wajib dilindungi dari penghapusan. */
  async remove(id: string): Promise<{ id: string }> {
    const page = await this.getOrFail(id);
    if (page.isMandatory) {
      throw new ConflictError('Halaman wajib tidak bisa dihapus.');
    }
    await this.repo.delete(id);
    return { id };
  }

  /** Slug unik dari teks; tambah akhiran acak bila bentrok. */
  private async uniqueSlug(source: string, exceptId?: string): Promise<string> {
    const base = slugify(source) || 'halaman';
    if (!(await this.repo.slugExists(base, exceptId))) return base;
    return `${base}-${nanoid(6).toLowerCase()}`;
  }

  /** Pastikan halaman ada atau lempar NotFound. */
  private async getOrFail(id: string) {
    const page = await this.repo.findById(id);
    if (!page) throw new NotFoundError('Halaman tidak ditemukan.');
    return page;
  }
}
