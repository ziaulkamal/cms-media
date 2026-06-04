/**
 * src/modules/users/users.module.ts
 * Modul Users: menyediakan UsersService (dipakai juga oleh AuthModule).
 */
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
