<!-- admin/src/pages/errors/NotFound.vue — 404: rute tidak ditemukan. -->
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
    <p class="text-primary text-5xl font-bold">404</p>
    <h1 class="text-lg font-semibold">Halaman tidak ditemukan</h1>
    <p class="text-text-muted text-sm">Tautan mungkin salah atau sudah dipindahkan.</p>
    <RouterLink to="/" class="text-primary text-sm font-medium hover:underline">
      Kembali ke Dashboard
    </RouterLink>
  </div>
</template>
