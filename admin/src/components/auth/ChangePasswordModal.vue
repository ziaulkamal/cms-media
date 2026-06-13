<!-- admin/src/components/auth/ChangePasswordModal.vue — ganti password mandiri (butuh password lama). -->
<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/http';
import Button from '@/components/ui/Button.vue';
import Modal from '@/components/ui/Modal.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useToast } from '@/composables/useToast';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const toast = useToast();
const saving = ref(false);
const formError = ref('');
const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });

/** Reset form tiap kali modal dibuka. */
watch(
  () => props.open,
  (open) => {
    if (open) {
      Object.assign(form, { currentPassword: '', newPassword: '', confirmPassword: '' });
      formError.value = '';
    }
  },
);

function close(): void {
  emit('update:open', false);
}

/** Validasi sisi klien lalu kirim perubahan password. */
async function onSubmit(): Promise<void> {
  formError.value = '';
  if (form.newPassword.length < 8) {
    formError.value = 'Password baru minimal 8 karakter.';
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    formError.value = 'Konfirmasi password tidak cocok.';
    return;
  }
  saving.value = true;
  try {
    await authApi.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    toast.success('Password berhasil diubah.');
    close();
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : 'Gagal mengubah password.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal :open="open" title="Ubah Password" size="sm" @update:open="emit('update:open', $event)">
    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <TextInput
        v-model="form.currentPassword"
        label="Password saat ini"
        type="password"
        required
      />
      <TextInput
        v-model="form.newPassword"
        label="Password baru"
        type="password"
        placeholder="Minimal 8 karakter"
        required
      />
      <TextInput
        v-model="form.confirmPassword"
        label="Ulangi password baru"
        type="password"
        required
        :error="formError"
      />
    </form>
    <template #footer>
      <Button variant="secondary" @click="close">Batal</Button>
      <Button :loading="saving" @click="onSubmit">Simpan</Button>
    </template>
  </Modal>
</template>
