/** admin/src/composables/useMenus.ts — server-state menu WEB (per lokasi + CRUD + reorder). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { menusApi } from '@/api/menus';
import type {
  CreateMenuItemPayload,
  MenuLocation,
  ReorderMenuItem,
  UpdateMenuItemPayload,
} from '@/types/cms';

/** Daftar menu satu lokasi (pohon, termasuk tersembunyi). */
export function useMenusQuery(location: Ref<MenuLocation>) {
  return useQuery({
    queryKey: computed(() => ['menus', location.value]),
    queryFn: () => menusApi.manage(location.value),
  });
}

/** Mutasi menu; invalidate seluruh cache menu pada sukses. */
export function useMenuMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['menus'] });

  return {
    create: useMutation({
      mutationFn: (payload: CreateMenuItemPayload) => menusApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateMenuItemPayload }) =>
        menusApi.update(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => menusApi.remove(id),
      onSuccess: invalidate,
    }),
    reorder: useMutation({
      mutationFn: (vars: { location: MenuLocation; items: ReorderMenuItem[] }) =>
        menusApi.reorder(vars.location, vars.items),
      onSuccess: invalidate,
    }),
  };
}
