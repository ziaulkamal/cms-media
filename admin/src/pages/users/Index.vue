<!-- admin/src/pages/users/Index.vue — kelola staf: list, create, edit (role, isActive). -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Trash2 } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import Alert from '@/components/ui/Alert.vue';
import Button from '@/components/ui/Button.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import Pagination from '@/components/ui/Pagination.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import UserCard from '@/components/users/UserCard.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useUserMutations, useUsersQuery } from '@/composables/useUsers';
import { useToast } from '@/composables/useToast';
import { usersApi } from '@/api/users';
import { toOptions, userRoleLabel } from '@/lib/labels';
import { useAuthStore } from '@/stores/auth';
import type { User, UserOwnership } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const page = ref(1);
const { data, isLoading, error } = useUsersQuery(page, 20);
const { create, update, setPassword, resetPassword, remove } = useUserMutations();
const auth = useAuthStore();

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

// ── Kelola password user (mode edit) ──
const newPassword = ref('');
const pwError = ref('');
/** Password hasil reset acak, ditampilkan sekali untuk disalin admin. */
const generatedPassword = ref('');

const roleOptions = toOptions(userRoleLabel);
const subtitle = computed(() =>
  data.value ? `${data.value.meta.total} akun staf redaksi.` : 'Akun staf redaksi.',
);

/** Bersihkan state khusus password (dipakai saat buka/tutup modal). */
function resetPasswordState(): void {
  newPassword.value = '';
  pwError.value = '';
  generatedPassword.value = '';
}

function openCreate(): void {
  editingId.value = null;
  formError.value = '';
  resetPasswordState();
  Object.assign(form, { email: '', name: '', password: '', role: 'CONTRIBUTOR', isActive: true });
  open.value = true;
}
function openEdit(user: User): void {
  editingId.value = user.id;
  formError.value = '';
  resetPasswordState();
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
const pwBusy = computed(
  () => setPassword.isPending.value || resetPassword.isPending.value,
);

/** Tetapkan password spesifik untuk user yang sedang diedit. */
async function onSetPassword(): Promise<void> {
  if (!editingId.value) return;
  pwError.value = '';
  if (newPassword.value.length < 8) {
    pwError.value = 'Password minimal 8 karakter.';
    return;
  }
  try {
    await setPassword.mutateAsync({
      id: editingId.value,
      payload: { password: newPassword.value },
    });
    resetPasswordState();
    toast.success('Password user diperbarui.');
  } catch (e) {
    pwError.value = e instanceof ApiError ? e.message : 'Gagal mengubah password.';
  }
}

/** Reset password user ke nilai acak lalu tampilkan untuk disalin. */
async function onResetPassword(): Promise<void> {
  if (!editingId.value) return;
  const ok = await confirm({
    title: 'Reset password',
    message: `Buat password acak baru untuk ${form.name}? Password lama langsung tidak berlaku.`,
    confirmText: 'Reset',
    danger: true,
  });
  if (!ok) return;
  pwError.value = '';
  try {
    const result = await resetPassword.mutateAsync(editingId.value);
    generatedPassword.value = result.password;
    newPassword.value = '';
    toast.success('Password berhasil di-reset.');
  } catch (e) {
    pwError.value = e instanceof ApiError ? e.message : 'Gagal reset password.';
  }
}

/** Salin password hasil reset ke clipboard. */
async function copyGenerated(): Promise<void> {
  try {
    await navigator.clipboard.writeText(generatedPassword.value);
    toast.success('Password disalin.');
  } catch {
    toast.error('Gagal menyalin password.');
  }
}

// ── Hapus user ──
const delOpen = ref(false);
const delId = ref('');
const delName = ref('');
const delLoading = ref(false);
const delError = ref('');
const delOwned = ref<UserOwnership | null>(null);
const delTransferTo = ref('');
const delCandidates = ref<{ value: string; label: string }[]>([]);
/** Akun yang sedang login tidak boleh menghapus dirinya sendiri. */
const isSelf = computed(() => !!editingId.value && editingId.value === auth.user?.id);
const delHasContent = computed(
  () => !!delOwned.value && delOwned.value.articles + delOwned.value.media + delOwned.value.revisions > 0,
);

/** Cek konten milik user + siapkan calon penerima (user aktif lain). */
async function openDelete(): Promise<void> {
  if (!editingId.value) return;
  delId.value = editingId.value;
  delName.value = form.name;
  delError.value = '';
  delTransferTo.value = '';
  delOwned.value = null;
  delLoading.value = true;
  open.value = false;
  delOpen.value = true;
  try {
    const [owned, all] = await Promise.all([
      usersApi.ownership(delId.value),
      usersApi.list(1, 100),
    ]);
    delOwned.value = owned;
    delCandidates.value = all.items
      .filter((u) => u.id !== delId.value && u.isActive)
      .map((u) => ({ value: u.id, label: `${u.name} — ${userRoleLabel[u.role]}` }));
  } catch (e) {
    delError.value = e instanceof ApiError ? e.message : 'Gagal memeriksa konten user.';
  } finally {
    delLoading.value = false;
  }
}

async function onDelete(): Promise<void> {
  delError.value = '';
  if (delHasContent.value && !delTransferTo.value) {
    delError.value = 'Pilih user penerima konten terlebih dahulu.';
    return;
  }
  try {
    const res = await remove.mutateAsync({
      id: delId.value,
      transferTo: delHasContent.value ? delTransferTo.value : undefined,
    });
    delOpen.value = false;
    toast.success(
      res.transferred
        ? `User ${delName.value} dihapus; kontennya dipindah.`
        : `User ${delName.value} dihapus.`,
    );
  } catch (e) {
    delError.value = e instanceof ApiError ? e.message : 'Gagal menghapus user.';
  }
}

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

      <!-- Kelola password (hanya saat edit user) -->
      <section v-if="editingId" class="border-border mt-5 border-t pt-5">
        <h4 class="text-text-primary text-sm font-semibold">Password</h4>
        <p class="text-text-muted mt-0.5 text-xs">
          Tetapkan password baru, atau buat password acak untuk diberikan ke user.
        </p>

        <Alert v-if="generatedPassword" variant="success" class="mt-3">
          <p class="font-medium">Password baru (tampil sekali):</p>
          <div class="mt-1.5 flex items-center gap-2">
            <code class="bg-surface border-border flex-1 rounded border px-2 py-1 font-mono text-sm">
              {{ generatedPassword }}
            </code>
            <Button size="sm" variant="secondary" @click="copyGenerated">Salin</Button>
          </div>
        </Alert>

        <form class="mt-3 flex items-end gap-2" @submit.prevent="onSetPassword">
          <TextInput
            v-model="newPassword"
            class="flex-1"
            label="Password baru"
            type="password"
            placeholder="Minimal 8 karakter"
            :error="pwError"
          />
          <Button :loading="setPassword.isPending.value" :disabled="pwBusy" @click="onSetPassword">
            Atur
          </Button>
        </form>

        <div class="mt-3 flex items-center justify-between gap-2">
          <span class="text-text-subtle text-xs">Atau buat password acak otomatis.</span>
          <Button
            variant="secondary"
            size="sm"
            :loading="resetPassword.isPending.value"
            :disabled="pwBusy"
            @click="onResetPassword"
          >
            Reset Acak
          </Button>
        </div>
      </section>

      <!-- Hapus user (tidak untuk akun sendiri) -->
      <section v-if="editingId && !isSelf" class="border-border mt-5 border-t pt-5">
        <h4 class="text-danger text-sm font-semibold">Hapus user</h4>
        <div class="mt-1 flex items-center justify-between gap-3">
          <p class="text-text-muted text-xs">
            Akun dihapus permanen. Artikel & media miliknya dipindah ke user lain yang Anda pilih.
          </p>
          <Button variant="danger" size="sm" @click="openDelete">
            <Trash2 class="h-3.5 w-3.5" /> Hapus
          </Button>
        </div>
      </section>
      <template #footer>
        <Button variant="secondary" @click="open = false">Batal</Button>
        <Button :loading="saving" @click="onSubmit">Simpan</Button>
      </template>
    </Modal>

    <Modal v-model:open="delOpen" :title="`Hapus user ${delName}`">
      <p v-if="delLoading" class="text-text-muted text-sm">Memeriksa konten milik user…</p>
      <template v-else-if="delOwned">
        <template v-if="delHasContent">
          <Alert variant="warning">
            {{ delName }} memiliki {{ delOwned.articles }} artikel, {{ delOwned.media }} media, dan
            {{ delOwned.revisions }} revisi. Semuanya dipindah ke user penerima; komentar tetap tersimpan.
          </Alert>
          <SelectInput
            v-model="delTransferTo"
            class="mt-4"
            label="Pindahkan konten ke"
            placeholder="Pilih user penerima"
            :options="delCandidates"
          />
        </template>
        <p v-else class="text-text-primary text-sm">
          {{ delName }} tidak memiliki artikel maupun media. Akun akan dihapus permanen.
        </p>
      </template>
      <p v-if="delError" class="text-danger mt-3 text-sm">{{ delError }}</p>
      <template #footer>
        <Button variant="secondary" @click="delOpen = false">Batal</Button>
        <Button
          variant="danger"
          :loading="remove.isPending.value"
          :disabled="delLoading || !delOwned"
          @click="onDelete"
        >
          Hapus Permanen
        </Button>
      </template>
    </Modal>
  </div>
</template>
