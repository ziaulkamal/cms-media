/**
 * src/modules/tags/tags.service.ts
 * Aturan bisnis Tag: slug unik dari nama.
 */
import { Injectable } from '@nestjs/common';
import { Prisma, Tag } from '@prisma/client';
import {
  ConflictError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { slugify } from '../../common/utils/slug';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsRepository } from './tags.repository';

/** Service Tag: pembuatan & pengambilan label. */
@Injectable()
export class TagsService {
  constructor(private readonly repo: TagsRepository) {}

  /** Buat tag; slug unik dari nama. */
  async create(dto: CreateTagDto): Promise<Tag> {
    const slug = slugify(dto.name);
    if (await this.repo.slugExists(slug)) {
      throw new ConflictError('Tag dengan nama serupa sudah ada.');
    }
    return this.repo.create({ name: dto.name, slug });
  }

  /** Ubah tag; bila nama berubah, slug diregenerasi & dijaga unik. */
  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const current = await this.getOrFail(id);
    const data: Prisma.TagUpdateInput = { name: dto.name };
    const slug = slugify(dto.name);
    if (slug !== current.slug) {
      if (await this.repo.slugExists(slug, id)) {
        throw new ConflictError('Tag dengan nama serupa sudah ada.');
      }
      data.slug = slug;
    }
    return this.repo.update(id, data);
  }

  /** Hapus tag; relasi article_tags ikut terhapus (cascade DB). */
  async remove(id: string): Promise<{ id: string }> {
    await this.getOrFail(id);
    await this.repo.delete(id);
    return { id };
  }

  /** Daftar seluruh tag. */
  list(): Promise<Tag[]> {
    return this.repo.findAll();
  }

  /** Pastikan tag ada atau lempar NotFound. */
  private async getOrFail(id: string): Promise<Tag> {
    const tag = await this.repo.findById(id);
    if (!tag) throw new NotFoundError('Tag tidak ditemukan.');
    return tag;
  }

  /** Ambil tag via slug. */
  async getBySlug(slug: string): Promise<Tag> {
    const tag = await this.repo.findBySlug(slug);
    if (!tag) throw new NotFoundError('Tag tidak ditemukan.');
    return tag;
  }
}
