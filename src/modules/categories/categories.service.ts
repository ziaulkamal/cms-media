/**
 * src/modules/categories/categories.service.ts
 * Aturan bisnis Category: slug unik, validasi induk, hierarki rubrik.
 */
import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import {
  ConflictError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { slugify } from '../../common/utils/slug';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/** Service Category: pembuatan & pengelolaan rubrik. */
@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  /** Buat kategori; slug unik dari nama, induk wajib valid bila diisi. */
  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(dto.name);
    if (await this.repo.slugExists(slug)) {
      throw new ConflictError('Kategori dengan nama serupa sudah ada.');
    }
    await this.assertParentExists(dto.parentId);
    return this.repo.create({
      name: dto.name,
      slug,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
  }

  /** Ubah kategori (nama dan/atau induk). */
  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.getOrFail(id);
    await this.assertParentExists(dto.parentId);
    return this.repo.update(id, {
      name: dto.name,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
  }

  /** Daftar seluruh kategori. */
  list(): Promise<Category[]> {
    return this.repo.findAll();
  }

  /** Ambil kategori via slug. */
  async getBySlug(slug: string): Promise<Category> {
    const category = await this.repo.findBySlug(slug);
    if (!category) throw new NotFoundError('Kategori tidak ditemukan.');
    return category;
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
}
