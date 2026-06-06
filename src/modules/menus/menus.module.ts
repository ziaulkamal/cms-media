/**
 * src/modules/menus/menus.module.ts
 * Modul Menus: controller + service + repository menu WEB.
 */
import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { MenusRepository } from './menus.repository';
import { MenusService } from './menus.service';

@Module({
  controllers: [MenusController],
  providers: [MenusService, MenusRepository],
  exports: [MenusService],
})
export class MenusModule {}
