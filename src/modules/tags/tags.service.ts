/**
 * src/modules/tags/tags.service.ts
 * Aturan bisnis Tag: slug unik dari nama.
 */
import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import {
  ConflictError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { slugify } from '../../common/utils/slug';
import { CreateTagDto } from './dto/create-tag.dto';
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

  /** Daftar seluruh tag. */
  list(): Promise<Tag[]> {
    return this.repo.findAll();
  }

  /** Ambil tag via slug. */
  async getBySlug(slug: string): Promise<Tag> {
    const tag = await this.repo.findBySlug(slug);
    if (!tag) throw new NotFoundError('Tag tidak ditemukan.');
    return tag;
  }
}
