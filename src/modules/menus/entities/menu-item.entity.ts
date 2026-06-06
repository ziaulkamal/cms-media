/**
 * src/modules/menus/entities/menu-item.entity.ts
 * View MenuItem + perakit pohon & pengelompokan per lokasi (untuk WEB & admin).
 */
import { MenuItem, MenuLinkType, MenuLocation } from '@prisma/client';

/** Bentuk item menu yang dikembalikan ke client. */
export interface MenuItemView {
  id: string;
  location: MenuLocation;
  parentId: string | null;
  label: string;
  type: MenuLinkType;
  url: string | null;
  openInNewTab: boolean;
  position: number;
  isVisible: boolean;
}

/** Node menu berjenjang (kolom footer -> item). */
export interface MenuNode extends MenuItemView {
  children: MenuNode[];
}

/** Payload menu publik tergrup per lokasi (sekali fetch untuk WEB). */
export interface MenusPayload {
  main: MenuNode[];
  footer: MenuNode[];
  footerBottom: MenuNode[];
}

/** Petakan entitas ke view. */
export function toMenuItemView(m: MenuItem): MenuItemView {
  return {
    id: m.id,
    location: m.location,
    parentId: m.parentId,
    label: m.label,
    type: m.type,
    url: m.url,
    openInNewTab: m.openInNewTab,
    position: m.position,
    isVisible: m.isVisible,
  };
}

/** Rakit daftar datar (satu lokasi) menjadi pohon, terurut posisi. */
export function buildMenuTree(items: MenuItem[]): MenuNode[] {
  const map = new Map<string, MenuNode>();
  items.forEach((m) => map.set(m.id, { ...toMenuItemView(m), children: [] }));
  const roots: MenuNode[] = [];
  map.forEach((node) => {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sortRec = (nodes: MenuNode[]) => {
    nodes.sort((a, b) => a.position - b.position);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

/** Kelompokkan seluruh item jadi payload per lokasi (masing-masing pohon). */
export function groupMenusByLocation(items: MenuItem[]): MenusPayload {
  const at = (loc: MenuLocation) =>
    buildMenuTree(items.filter((m) => m.location === loc));
  return {
    main: at(MenuLocation.MAIN),
    footer: at(MenuLocation.FOOTER),
    footerBottom: at(MenuLocation.FOOTER_BOTTOM),
  };
}
