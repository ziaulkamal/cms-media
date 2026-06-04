/**
 * src/modules/articles/dto/update-article.dto.ts
 * Kontrak perubahan artikel; semua field opsional, tetap ter-whitelist.
 */
import { PartialType } from '@nestjs/swagger';
import { CreateArticleDto } from './create-article.dto';

/** Field yang boleh diubah pada artikel (subset opsional dari Create). */
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
