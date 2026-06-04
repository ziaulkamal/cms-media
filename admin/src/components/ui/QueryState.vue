<!-- admin/src/components/ui/QueryState.vue — bungkus state async: loading / error / empty / konten. -->
<script setup lang="ts">
import { ApiError } from '@/api/http';
import Spinner from './Spinner.vue';

const props = defineProps<{
  loading: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyText?: string;
}>();

/** Ambil pesan ramah dari error (ApiError -> message; selain itu generik). */
function errorMessage(): string {
  if (props.error instanceof ApiError) return props.error.message;
  return 'Gagal memuat data.';
}
</script>

<template>
  <div
    v-if="loading"
    class="text-text-muted flex items-center justify-center gap-2 py-12 text-sm"
  >
    <Spinner class="h-5 w-5" />
    Memuat…
  </div>

  <div
    v-else-if="error"
    class="text-danger bg-danger-light border-danger/30 rounded-md border px-4 py-3 text-sm"
    role="alert"
  >
    {{ errorMessage() }}
  </div>

  <div
    v-else-if="isEmpty"
    class="text-text-muted flex flex-col items-center justify-center gap-1 py-12 text-sm"
  >
    <slot name="empty">{{ emptyText ?? 'Belum ada data.' }}</slot>
  </div>

  <slot v-else />
</template>
