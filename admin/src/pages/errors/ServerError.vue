<!-- admin/src/pages/errors/ServerError.vue — 500: kesalahan server. -->
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
    <p class="text-danger text-5xl font-bold">500</p>
    <h1 class="text-lg font-semibold">Terjadi kesalahan</h1>
    <p class="text-text-muted text-sm">Server sedang bermasalah. Coba lagi beberapa saat.</p>
    <RouterLink to="/" class="text-primary text-sm font-medium hover:underline">
      Kembali ke Dashboard
    </RouterLink>
  </div>
</template>
