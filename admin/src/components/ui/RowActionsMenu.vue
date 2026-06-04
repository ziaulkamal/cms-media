<!-- admin/src/components/ui/RowActionsMenu.vue — menu aksi baris (kebab ⋯); dropdown di-teleport agar tak terpotong overflow tabel. -->
<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { MoreVertical } from 'lucide-vue-next';
import { ref, type Component } from 'vue';

export interface RowAction {
  label: string;
  icon?: Component;
  onClick: () => void;
  danger?: boolean;
}

defineProps<{ items: RowAction[] }>();

const trigger = ref<HTMLElement | null>(null);
const style = ref<Record<string, string>>({});

/** Hitung posisi dropdown (fixed) dari tombol pemicu sebelum dibuka. */
function place(): void {
  const r = trigger.value?.getBoundingClientRect();
  if (!r) return;
  style.value = {
    top: `${r.bottom + 6}px`,
    right: `${Math.max(8, window.innerWidth - r.right)}px`,
  };
}
</script>

<template>
  <Menu as="div" class="inline-block text-left">
    <span ref="trigger" class="inline-flex">
      <MenuButton
        class="border-border text-text-muted hover:bg-bg-subtle hover:text-text-primary inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors focus:outline-none"
        aria-label="Aksi lainnya"
        @click="place"
      >
        <MoreVertical class="h-4 w-4" />
      </MenuButton>
    </span>

    <Teleport to="body">
      <MenuItems
        :style="style"
        class="bg-surface border-border fixed z-50 w-52 overflow-hidden rounded-xl border p-1.5 shadow-lg focus:outline-none"
      >
        <MenuItem v-for="(item, i) in items" :key="i" v-slot="{ active }">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors"
            :class="
              item.danger
                ? active
                  ? 'bg-danger-light text-danger'
                  : 'text-danger'
                : active
                  ? 'bg-bg-subtle text-text-primary'
                  : 'text-text-primary'
            "
            @click="item.onClick"
          >
            <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" />
            {{ item.label }}
          </button>
        </MenuItem>
      </MenuItems>
    </Teleport>
  </Menu>
</template>
