/**
 * src/prisma/prisma.service.ts
 * Wrapper PrismaClient sebagai provider Nest (1 koneksi, lifecycle terkelola).
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** PrismaClient terkelola Nest: connect saat init, disconnect saat shutdown. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
