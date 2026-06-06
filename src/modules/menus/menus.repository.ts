/**
 * src/modules/menus/menus.repository.ts
 * Akses data MenuItem (query Prisma terpusat): per lokasi, urutan, & reorder.
 */
import { Injectable } from '@nestjs/common';
import { MenuItem, MenuLocation, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Satu simpul susunan baru (untuk reorder). */
export interface MenuPosition {
  id: string;
  parentId: string | null;
  position: number;
}

/** Repository MenuItem: pembungkus query Prisma. */
@Injectable()
export class MenusRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MenuItemCreateInput): Promise<MenuItem> {
    return this.prisma.menuItem.create({ data });
  }

  update(id: string, data: Prisma.MenuItemUpdateInput): Promise<MenuItem> {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  delete(id: string): Promise<MenuItem> {
    return this.prisma.menuItem.delete({ where: { id } });
  }

  findById(id: string): Promise<MenuItem | null> {
    return this.prisma.menuItem.findUnique({ where: { id } });
  }

  /** Semua item yang terlihat (untuk WEB), urut lokasi lalu posisi. */
  findAllVisible(): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { isVisible: true },
      orderBy: [{ location: 'asc' }, { position: 'asc' }],
    });
  }

  /** Semua item satu lokasi (termasuk tersembunyi) untuk admin. */
  findByLocation(location: MenuLocation): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { location },
      orderBy: { position: 'asc' },
    });
  }

  /** Posisi terbesar di antara saudara; -1 bila kosong. */
  async maxPositionAmong(
    location: MenuLocation,
    parentId: string | null,
  ): Promise<number> {
    const top = await this.prisma.menuItem.findFirst({
      where: { location, parentId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return top?.position ?? -1;
  }

  /** Terapkan susunan baru (induk + posisi) dalam satu transaksi. */
  async applyOrder(items: MenuPosition[]): Promise<void> {
    await this.prisma.$transaction(
      items.map((it) =>
        this.prisma.menuItem.update({
          where: { id: it.id },
          data: { parentId: it.parentId, position: it.position },
        }),
      ),
    );
  }
}
