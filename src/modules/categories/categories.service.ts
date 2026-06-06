/**
 * src/modules/categories/categories.service.ts
 * Aturan bisnis Category: slug unik, hierarki rubrik, urutan, & kategori default.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Category } from '@prisma/client';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { slugify } from '../../common/utils/slug';
import {
  CategoriesRepository,
  CategoryPosition,
} from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryView, toCategoryView } from './entities/category.entity';

/** Service Category: pembuatan & pengelolaan rubrik berhierarki. */
@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly repo: CategoriesRepository) {}

  /**
   * Saat modul start: pastikan kategori default ("article") tersedia, lalu
   * pindahkan artikel lama tanpa kategori ke default (idempoten).
   */
  async onModuleInit(): Promise<void> {
    const def = await this.repo.ensureDefault();
    const moved = await this.repo.reassignOrphanArticles(def.id);
    this.logger.log(
      `Kategori default siap: ${def.slug} (${def.id})` +
        (moved > 0 ? `; ${moved} artikel tanpa kategori dipindah ke default.` : '.'),
    );
  }

  /** Buat kategori; slug unik dari nama, induk valid, posisi di akhir saudara. */
  async create(dto: CreateCategoryDto): Promise<CategoryView> {
    const slug = slugify(dto.name);
    if (await this.repo.slugExists(slug)) {
      throw new ConflictError('Kategori dengan nama serupa sudah ada.');
    }
    await this.assertParentExists(dto.parentId);
    const parentId = dto.parentId ?? null;
    const position = (await this.repo.maxPositionAmong(parentId)) + 1;
    const created = await this.repo.create({
      name: dto.name,
      slug,
      position,
      parent: parentId ? { connect: { id: parentId } } : undefined,
    });
    return toCategoryView(created);
  }

  /** Ubah kategori (nama dan/atau induk); jaga proteksi default & anti-siklus. */
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryView> {
    const current = await this.getOrFail(id);

    // Induk hanya divalidasi bila field dikirim (boleh null = jadikan root).
    const reparenting = dto.parentId !== undefined;
    const nextParentId = dto.parentId ?? null;

    if (reparenting) {
      if (current.isDefault && nextParentId !== null) {
        throw new ValidationError(
          'Kategori default harus tetap di akar (tanpa induk).',
        );
      }
      await this.assertParentExists(nextParentId ?? undefined);
      await this.assertNoCycle(id, nextParentId);
    }

    const updated = await this.repo.update(id, {
      name: dto.name,
      ...(reparenting && {
        parent: nextParentId
          ? { connect: { id: nextParentId } }
          : { disconnect: true },
      }),
    });
    return toCategoryView(updated);
  }

  /** Susun ulang pohon (urutan + jenjang) menyeluruh dalam satu transaksi. */
  async reorder(dto: ReorderCategoriesDto): Promise<{ updated: number }> {
    const all = await this.repo.findAll();
    const knownIds = new Set(all.map((c) => c.id));
    const defaultId = all.find((c) => c.isDefault)?.id ?? null;

    const items: CategoryPosition[] = dto.items.map((it) => ({
      id: it.id,
      parentId: it.parentId ?? null,
      position: it.position,
    }));

    for (const it of items) {
      if (!knownIds.has(it.id)) {
        throw new NotFoundError(`Kategori ${it.id} tidak ditemukan.`);
      }
      if (it.parentId && !knownIds.has(it.parentId)) {
        throw new NotFoundError(`Kategori induk ${it.parentId} tidak ditemukan.`);
      }
      if (it.id === defaultId && it.parentId !== null) {
        throw new ValidationError(
          'Kategori default harus tetap di akar (tanpa induk).',
        );
      }
    }

    this.assertNoCycleInGraph(items);
    await this.repo.applyOrder(items);
    return { updated: items.length };
  }

  /** Hapus kategori; artikel terkait dipindah ke kategori default. */
  async remove(id: string): Promise<{ id: string }> {
    const current = await this.getOrFail(id);
    if (current.isDefault) {
      throw new ValidationError('Kategori default tidak dapat dihapus.');
    }
    const defaultId = await this.getDefaultId();
    await this.repo.deleteWithReassign(id, defaultId);
    return { id };
  }

  /** Hapus banyak kategori sekaligus; kategori default dilewati & dilindungi. */
  async bulkRemove(ids: string[]): Promise<{ deleted: number }> {
    const defaultId = await this.getDefaultId();
    const targets = ids.filter((id) => id !== defaultId);
    if (targets.length === 0) return { deleted: 0 };
    const deleted = await this.repo.deleteManyWithReassign(targets, defaultId);
    return { deleted };
  }

  /** Daftar seluruh kategori (dengan jumlah artikel), siap dirakit jadi pohon. */
  async list(): Promise<CategoryView[]> {
    const all = await this.repo.findAll();
    return all.map(toCategoryView);
  }

  /** Ambil kategori via slug. */
  async getBySlug(slug: string): Promise<Category> {
    const category = await this.repo.findBySlug(slug);
    if (!category) throw new NotFoundError('Kategori tidak ditemukan.');
    return category;
  }

  /** Id kategori default; dibuat bila belum ada. Dipakai modul lain. */
  async getDefaultId(): Promise<string> {
    const existing = await this.repo.findDefault();
    if (existing) return existing.id;
    return (await this.repo.ensureDefault()).id;
  }

  /** Pastikan kategori ada atau lempar NotFound. */
  private async getOrFail(id: string): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category) throw new NotFoundError('Kategori tidak ditemukan.');
    return category;
  }

  /** Validasi induk bila parentId diberikan. */
  private async assertParentExists(parentId?: string): Promise<void> {
    if (parentId && !(await this.repo.findById(parentId))) {
      throw new NotFoundError('Kategori induk tidak ditemukan.');
    }
  }

  /** Cegah siklus: induk baru tak boleh diri sendiri atau keturunannya. */
  private async assertNoCycle(
    id: string,
    nextParentId: string | null,
  ): Promise<void> {
    if (!nextParentId) return;
    if (nextParentId === id) {
      throw new ValidationError('Kategori tidak boleh menjadi induk dirinya sendiri.');
    }
    const seen = new Set<string>();
    let cursor: string | null = nextParentId;
    while (cursor) {
      if (cursor === id) {
        throw new ValidationError('Kategori tidak boleh dipindah ke dalam sub-kategorinya sendiri.');
      }
      if (seen.has(cursor)) break; // data lama korup → hentikan, jangan loop
      seen.add(cursor);
      const parent: Category | null = await this.repo.findById(cursor);
      cursor = parent?.parentId ?? null;
    }
  }

  /** Cegah siklus pada susunan menyeluruh (reorder) sebelum disimpan. */
  private assertNoCycleInGraph(items: CategoryPosition[]): void {
    const parentOf = new Map<string, string | null>();
    for (const it of items) parentOf.set(it.id, it.parentId);

    for (const start of parentOf.keys()) {
      const seen = new Set<string>();
      let cursor: string | null | undefined = start;
      while (cursor) {
        if (seen.has(cursor)) {
          throw new ValidationError('Susunan kategori membentuk siklus.');
        }
        seen.add(cursor);
        cursor = parentOf.get(cursor) ?? null;
      }
    }
  }
}
