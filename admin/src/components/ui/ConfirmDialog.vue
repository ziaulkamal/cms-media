<!-- admin/src/components/ui/ConfirmDialog.vue — render dialog konfirmasi global (lihat useConfirm). -->
<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import Button from '@/components/ui/Button.vue';
import Modal from '@/components/ui/Modal.vue';
import { useConfirm } from '@/composables/useConfirm';

const { state, respond } = useConfirm();

function onOpenChange(value: boolean): void {
  if (!value) respond(false);
}
</script>

<template>
  <Modal :open="state.open" @update:open="onOpenChange">
    <div class="flex items-start gap-3">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        :class="state.danger ? 'bg-danger-light text-danger' : 'bg-primary-light text-primary'"
      >
        <AlertTriangle class="h-5 w-5" />
      </span>
      <div class="min-w-0">
        <h2 class="text-text-primary text-sm font-semibold">
          {{ state.title ?? 'Konfirmasi' }}
        </h2>
        <p class="text-text-muted mt-1 text-sm">{{ state.message }}</p>
      </div>
    </div>
    <template #footer>
      <Button variant="secondary" @click="respond(false)">
        {{ state.cancelText ?? 'Batal' }}
      </Button>
      <Button :variant="state.danger ? 'danger' : 'primary'" @click="respond(true)">
        {{ state.confirmText ?? 'Konfirmasi' }}
      </Button>
    </template>
  </Modal>
</template>
