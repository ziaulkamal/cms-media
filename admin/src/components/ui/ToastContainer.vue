<!-- admin/src/components/ui/ToastContainer.vue — render antrean toast global (pojok kanan atas). -->
<script setup lang="ts">
import { useToast, type ToastType } from '@/composables/useToast';

const { toasts, dismiss } = useToast();

const styles: Record<ToastType, string> = {
  success: 'bg-success-light text-success border-success/30',
  error: 'bg-danger-light text-danger border-danger/30',
  warning: 'bg-warning-light text-warning border-warning/30',
  info: 'bg-info-light text-info border-info/30',
};
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="styles[t.type]"
        class="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-md"
        role="alert"
      >
        <span class="flex-1">{{ t.message }}</span>
        <button
          type="button"
          class="text-text-subtle hover:text-text-primary"
          aria-label="Tutup notifikasi"
          @click="dismiss(t.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
