/**
 * src/prisma/prisma.module.ts
 * Modul global menyediakan PrismaService ke seluruh repository tanpa re-import.
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Sediakan PrismaService secara global untuk dipakai lapisan repository. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
