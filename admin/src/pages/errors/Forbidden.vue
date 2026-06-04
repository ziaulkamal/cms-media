<!-- admin/src/pages/errors/Forbidden.vue — 403: role tidak cukup untuk halaman ini. -->
<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
    <p class="text-primary text-5xl font-bold">403</p>
    <h1 class="text-lg font-semibold">Akses ditolak</h1>
    <p class="text-text-muted text-sm">Anda tidak memiliki izin untuk membuka halaman ini.</p>
    <RouterLink to="/" class="text-primary text-sm font-medium hover:underline">
      Kembali ke Dashboard
    </RouterLink>
  </div>
</template>
