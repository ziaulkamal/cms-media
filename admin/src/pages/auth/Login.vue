<!-- admin/src/pages/auth/Login.vue — form login: panggil auth.login, tangani 429 & error. -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import Alert from '@/components/ui/Alert.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import TextInput from '@/components/ui/TextInput.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

/** Submit kredensial; petakan error rate-limit & kredensial salah ke pesan ramah. */
async function onSubmit(): Promise<void> {
  error.value = '';
  loading.value = true;
  try {
    await auth.login({ email: email.value, password: password.value });
    const redirect = (route.query.redirect as string) || '/';
    await router.replace(redirect);
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) {
      error.value = 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.';
    } else if (e instanceof ApiError) {
      error.value = e.message;
    } else {
      error.value = 'Gagal login. Periksa koneksi Anda.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <Card>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <Alert v-if="error" variant="danger">{{ error }}</Alert>
        <TextInput
          v-model="email"
          label="Email"
          type="email"
          autocomplete="username"
          placeholder="admin@cms-media.local"
          required
        />
        <TextInput
          v-model="password"
          label="Password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />
        <Button type="submit" :loading="loading" block>Masuk</Button>
      </form>
    </Card>
  </AuthLayout>
</template>
