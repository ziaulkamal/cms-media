/**
 * src/modules/menus/menus.service.ts
 * Aturan bisnis MenuItem: 3 lokasi, FOOTER berjenjang (maks 2 level),
 * urutan via drag-and-drop, dan payload publik tergrup.
 */
import { Injectable } from '@nestjs/common';
import { MenuItem, MenuLinkType, MenuLocation } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderMenusDto } from './dto/reorder-menus.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import {
  MenuItemView,
  MenuNode,
  MenusPayload,
  buildMenuTree,
  groupMenusByLocation,
  toMenuItemView,
} from './entities/menu-item.entity';
import { MenuPosition, MenusRepository } from './menus.repository';

/** Service MenuItem: pembuatan, perubahan, penyusunan, & penyajian menu. */
@Injectable()
export class MenusService {
  constructor(private readonly repo: MenusRepository) {}

  /** Menu publik (hanya yang terlihat) tergrup per lokasi & berjenjang. */
  async getPublicMenus(): Promise<MenusPayload> {
    return groupMenusByLocation(await this.repo.findAllVisible());
  }

  /** Daftar menu satu lokasi (termasuk tersembunyi) sebagai pohon, untuk admin. */
  async listByLocation(location: MenuLocation): Promise<MenuNode[]> {
    return buildMenuTree(await this.repo.findByLocation(location));
  }

  /** Buat item menu; validasi jenjang sesuai lokasi, posisi di akhir saudara. */
  async create(dto: CreateMenuItemDto): Promise<MenuItemView> {
    const parentId = dto.parentId ?? null;
    await this.assertParentValid(dto.location, parentId);

    const position = (await this.repo.maxPositionAmong(dto.location, parentId)) + 1;
    const created = await this.repo.create({
      location: dto.location,
      label: dto.label,
      type: dto.type ?? MenuLinkType.ROUTE,
      url: dto.url ?? null,
      openInNewTab: dto.openInNewTab ?? false,
      isVisible: dto.isVisible ?? true,
      position,
      parent: parentId ? { connect: { id: parentId } } : undefined,
    });
    return toMenuItemView(created);
  }

  /** Ubah atribut tampilan/tautan item (bukan lokasi/jenjang). */
  async update(id: string, dto: UpdateMenuItemDto): Promise<MenuItemView> {
    await this.getOrFail(id);
    const updated = await this.repo.update(id, {
      label: dto.label,
      type: dto.type,
      url: dto.url,
      openInNewTab: dto.openInNewTab,
      isVisible: dto.isVisible,
    });
    return toMenuItemView(updated);
  }

  /** Hapus item; jika kolom footer, anaknya ikut terhapus (cascade). */
  async remove(id: string): Promise<{ id: string }> {
    await this.getOrFail(id);
    await this.repo.delete(id);
    return { id };
  }

  /** Susun ulang seluruh menu satu lokasi (urutan + jenjang) dalam 1 transaksi. */
  async reorder(dto: ReorderMenusDto): Promise<{ updated: number }> {
    const existing = await this.repo.findByLocation(dto.location);
    const byId = new Map(existing.map((m) => [m.id, m]));

    const items: MenuPosition[] = dto.items.map((it) => ({
      id: it.id,
      parentId: it.parentId ?? null,
      position: it.position,
    }));
    const parentOf = new Map(items.map((it) => [it.id, it.parentId]));

    for (const it of items) {
      if (!byId.has(it.id)) {
        throw new NotFoundError(`Item menu ${it.id} bukan milik lokasi ini.`);
      }
      if (!it.parentId) continue;

      // Hanya FOOTER yang boleh berjenjang.
      if (dto.location !== MenuLocation.FOOTER) {
        throw new ValidationError('Lokasi menu ini tidak mendukung sub-item.');
      }
      if (!byId.has(it.parentId)) {
        throw new NotFoundError(`Induk ${it.parentId} tidak ditemukan di lokasi ini.`);
      }
      if (it.parentId === it.id) {
        throw new ValidationError('Item tidak boleh menjadi induk dirinya sendiri.');
      }
      // Batas 2 level: induk wajib root (induknya sendiri harus null).
      if (parentOf.get(it.parentId)) {
        throw new ValidationError('Menu footer maksimal 2 tingkat (kolom → item).');
      }
    }

    await this.repo.applyOrder(items);
    return { updated: items.length };
  }

  /** Pastikan item ada atau lempar NotFound. */
  private async getOrFail(id: string): Promise<MenuItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundError('Item menu tidak ditemukan.');
    return item;
  }

  /** Validasi penempatan induk sesuai lokasi (jenjang & konsistensi). */
  private async assertParentValid(
    location: MenuLocation,
    parentId: string | null,
  ): Promise<void> {
    if (!parentId) return;
    if (location !== MenuLocation.FOOTER) {
      throw new ValidationError('Hanya menu footer yang mendukung sub-item.');
    }
    const parent = await this.repo.findById(parentId);
    if (!parent || parent.location !== location) {
      throw new NotFoundError('Kolom induk tidak ditemukan di lokasi ini.');
    }
    if (parent.parentId) {
      throw new ValidationError('Menu footer maksimal 2 tingkat (kolom → item).');
    }
  }
}
