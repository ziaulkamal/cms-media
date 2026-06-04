/**
 * src/modules/tags/tags.module.ts
 * Modul Tags: controller + service + repository label.
 */
import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsRepository } from './tags.repository';
import { TagsService } from './tags.service';

@Module({
  controllers: [TagsController],
  providers: [TagsService, TagsRepository],
})
export class TagsModule {}
