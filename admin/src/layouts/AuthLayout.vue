<!-- admin/src/layouts/AuthLayout.vue — layout halaman auth ala Admin_FE (brand gradient). -->
<script setup lang="ts"></script>

<template>
  <div class="bg-bg flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="mb-6 flex flex-col items-center gap-3 text-center">
        <div class="brand-logo">
          <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" fill="white" fill-opacity="0.95" />
            <circle cx="10" cy="10" r="3" fill="white" fill-opacity="0.5" />
          </svg>
        </div>
        <div>
          <h1 class="text-text-primary text-xl font-bold">CMS Media</h1>
          <p class="text-text-muted mt-0.5 text-sm">Panel Administrasi</p>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.brand-logo {
  width: 52px;
  height: 52px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-violet) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glow);
}
</style>
