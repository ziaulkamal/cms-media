<!-- admin/src/components/ui/Modal.vue — dialog modal aksesibel (HeadlessUI), v-model:open. -->
<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import { X } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { size: 'md' },
);
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

function close(): void {
  emit('update:open', false);
}
</script>

<template>
  <TransitionRoot :show="open" as="template">
    <Dialog class="relative z-50" @close="close">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        <TransitionChild
          as="template"
          enter="duration-200 ease-out"
          enter-from="opacity-0 translate-y-2 scale-95"
          enter-to="opacity-100 translate-y-0 scale-100"
          leave="duration-150 ease-in"
          leave-from="opacity-100 translate-y-0 scale-100"
          leave-to="opacity-0 translate-y-2 scale-95"
        >
          <DialogPanel
            :class="sizes[size]"
            class="bg-surface border-border flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-xl border shadow-xl"
          >
            <header
              v-if="title || $slots.header"
              class="border-border flex items-start gap-4 border-b px-5 py-4"
            >
              <slot name="header">
                <div class="min-w-0 flex-1">
                  <DialogTitle class="text-text-primary text-base font-semibold tracking-tight">
                    {{ title }}
                  </DialogTitle>
                  <p v-if="description" class="text-text-muted mt-0.5 text-sm">
                    {{ description }}
                  </p>
                </div>
              </slot>
              <button
                type="button"
                aria-label="Tutup"
                class="text-text-subtle hover:bg-bg-subtle hover:text-text-primary -mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors"
                @click="close"
              >
                <X class="h-4.5 w-4.5" />
              </button>
            </header>

            <div class="flex-1 overflow-y-auto px-5 py-5">
              <slot />
            </div>

            <footer
              v-if="$slots.footer"
              class="border-border bg-bg-subtle/40 flex justify-end gap-2 border-t px-5 py-3"
            >
              <slot name="footer" />
            </footer>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
