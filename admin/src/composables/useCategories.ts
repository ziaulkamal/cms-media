/** admin/src/composables/useCategories.ts — server-state kategori (list + CRUD). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { categoriesApi } from '@/api/categories';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '@/types/cms';

/** Daftar seluruh kategori (flat). */
export function useCategoriesQuery() {
  return useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() });
}

/** Mutasi kategori; invalidate daftar pada sukses. */
export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['categories'] });

  return {
    create: useMutation({
      mutationFn: (payload: CreateCategoryPayload) => categoriesApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateCategoryPayload }) =>
        categoriesApi.update(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => categoriesApi.remove(id),
      onSuccess: invalidate,
    }),
  };
}
