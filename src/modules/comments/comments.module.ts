/**
 * src/modules/comments/comments.module.ts
 * Modul Comments: controller + service + repository komentar pembaca.
 */
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ArticleCommentsController } from './article-comments.controller';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';

@Module({
  imports: [UsersModule],
  controllers: [CommentsController, ArticleCommentsController],
  providers: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
