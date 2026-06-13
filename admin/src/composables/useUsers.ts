/** admin/src/composables/useUsers.ts — server-state pengelolaan staf (ADMIN). */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { usersApi } from '@/api/users';
import type {
  CreateUserPayload,
  SetPasswordPayload,
  UpdateUserPayload,
} from '@/types/cms';

/** Daftar user ber-paginasi (page reaktif). */
export function useUsersQuery(page: MaybeRefOrGetter<number>, perPage = 20) {
  const pageRef = computed(() => toValue(page));
  return useQuery({
    queryKey: ['users', pageRef, perPage],
    queryFn: () => usersApi.list(pageRef.value, perPage),
    placeholderData: keepPreviousData,
  });
}

/** Mutasi user; invalidate daftar pada sukses. */
export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['users'] });

  return {
    create: useMutation({
      mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (vars: { id: string; payload: UpdateUserPayload }) =>
        usersApi.update(vars.id, vars.payload),
      onSuccess: invalidate,
    }),
    setPassword: useMutation({
      mutationFn: (vars: { id: string; payload: SetPasswordPayload }) =>
        usersApi.setPassword(vars.id, vars.payload),
    }),
    resetPassword: useMutation({
      mutationFn: (id: string) => usersApi.resetPassword(id),
    }),
  };
}
