<!-- admin/src/pages/users/Index.vue — kelola staf: list, create, edit (role, isActive). -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ApiError } from '@/api/http';
import Button from '@/components/ui/Button.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import Pagination from '@/components/ui/Pagination.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import UserCard from '@/components/users/UserCard.vue';
import { useUserMutations, useUsersQuery } from '@/composables/useUsers';
import { useToast } from '@/composables/useToast';
import { toOptions, userRoleLabel } from '@/lib/labels';
import type { User } from '@/types/cms';

const toast = useToast();
const page = ref(1);
const { data, isLoading, error } = useUsersQuery(page, 20);
const { create, update } = useUserMutations();

const open = ref(false);
const editingId = ref<string | null>(null);
const formError = ref('');
const form = reactive({
  email: '',
  name: '',
  password: '',
  role: 'CONTRIBUTOR' as string,
  isActive: true,
});

const roleOptions = toOptions(userRoleLabel);
const subtitle = computed(() =>
  data.value ? `${data.value.meta.total} akun staf redaksi.` : 'Akun staf redaksi.',
);

function openCreate(): void {
  editingId.value = null;
  formError.value = '';
  Object.assign(form, { email: '', name: '', password: '', role: 'CONTRIBUTOR', isActive: true });
  open.value = true;
}
function openEdit(user: User): void {
  editingId.value = user.id;
  formError.value = '';
  Object.assign(form, {
    email: user.email,
    name: user.name,
    password: '',
    role: user.role,
    isActive: user.isActive,
  });
  open.value = true;
}

const saving = computed(() => create.isPending.value || update.isPending.value);

/** Simpan user (create dengan password; edit name/role/status). */
async function onSubmit(): Promise<void> {
  formError.value = '';
  try {
    if (editingId.value) {
      await update.mutateAsync({
        id: editingId.value,
        payload: {
          name: form.name,
          role: form.role as User['role'],
          isActive: form.isActive,
        },
      });
      toast.success('User diperbarui.');
    } else {
      await create.mutateAsync({
        email: form.email,
        name: form.name,
        password: form.password,
        role: form.role as User['role'],
      });
      toast.success('User dibuat.');
    }
    open.value = false;
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : 'Gagal menyimpan user.';
  }
}
</script>

<template>
  <div>
    <PageHeader title="Pengguna" :subtitle="subtitle">
      <template #actions>
        <Button @click="openCreate">User Baru</Button>
      </template>
    </PageHeader>

    <QueryState
      :loading="isLoading"
      :error="error"
      :is-empty="!data || data.items.length === 0"
      empty-text="Belum ada user."
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <UserCard
          v-for="user in data!.items"
          :key="user.id"
          :user="user"
          @edit="openEdit(user)"
        />
      </div>

      <div class="mt-6">
        <Pagination
          :page="data!.meta.page"
          :per-page="data!.meta.perPage"
          :total="data!.meta.total"
          :total-pages="data!.meta.totalPages"
          @update:page="page = $event"
        />
      </div>
    </QueryState>

    <Modal v-model:open="open" :title="editingId ? 'Edit User' : 'User Baru'">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <TextInput
          v-if="!editingId"
          v-model="form.email"
          label="Email"
          type="email"
          required
        />
        <TextInput v-model="form.name" label="Nama" required :error="formError" />
        <TextInput
          v-if="!editingId"
          v-model="form.password"
          label="Password"
          type="password"
          required
        />
        <SelectInput v-model="form.role" label="Peran" :allow-empty="false" :options="roleOptions" />
        <label v-if="editingId" class="flex items-center gap-2 text-sm">
          <input v-model="form.isActive" type="checkbox" class="accent-primary" />
          Akun aktif
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="open = false">Batal</Button>
        <Button :loading="saving" @click="onSubmit">Simpan</Button>
      </template>
    </Modal>
  </div>
</template>
