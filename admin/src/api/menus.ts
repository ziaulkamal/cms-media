/** admin/src/api/menus.ts — endpoint menu WEB (kelola + reorder editor). */
import type {
  CreateMenuItemPayload,
  MenuItem,
  MenuLocation,
  MenuNode,
  ReorderMenuItem,
  SuccessEnvelope,
  UpdateMenuItemPayload,
} from '@/types/cms';
import { http, unwrap } from './http';

export const menusApi = {
  /** Daftar satu lokasi (termasuk tersembunyi) sebagai pohon. */
  manage: (location: MenuLocation) =>
    unwrap<MenuNode[]>(
      http.get<SuccessEnvelope<MenuNode[]>>('/menus/manage', {
        params: { location },
      }),
    ),

  create: (payload: CreateMenuItemPayload) =>
    unwrap<MenuItem>(http.post<SuccessEnvelope<MenuItem>>('/menus', payload)),

  update: (id: string, payload: UpdateMenuItemPayload) =>
    unwrap<MenuItem>(
      http.patch<SuccessEnvelope<MenuItem>>(`/menus/${id}`, payload),
    ),

  remove: (id: string) => http.delete(`/menus/${id}`),

  reorder: (location: MenuLocation, items: ReorderMenuItem[]) =>
    unwrap<{ updated: number }>(
      http.patch<SuccessEnvelope<{ updated: number }>>('/menus/reorder', {
        location,
        items,
      }),
    ),
};
