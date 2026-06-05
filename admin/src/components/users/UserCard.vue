<!-- admin/src/components/users/UserCard.vue — kartu staf: avatar gradient per peran, status, aksi edit. -->
<script setup lang="ts">
import dayjs from 'dayjs';
import { Pencil } from 'lucide-vue-next';
import { computed } from 'vue';
import Badge from '@/components/ui/Badge.vue';
import { userInitials } from '@/lib/avatar';
import { userRoleLabel, userRoleVariant } from '@/lib/labels';
import type { User, UserRole } from '@/types/cms';

const props = defineProps<{ user: User }>();
defineEmits<{ edit: [] }>();

/** Pasangan token warna gradient avatar per peran (token tema, bukan hex). */
const roleGradient: Record<UserRole, [string, string]> = {
  ADMIN: ['var(--color-primary)', 'var(--color-primary-violet)'],
  EDITOR: ['var(--color-info)', 'var(--color-primary)'],
  AUTHOR: ['var(--color-success)', 'var(--color-info)'],
  CONTRIBUTOR: ['var(--color-text-subtle)', 'var(--color-text-muted)'],
};

const initials = computed(() => userInitials(props.user.name));
const gradient = computed(() => {
  const [from, to] = roleGradient[props.user.role];
  return { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` };
});
const joined = computed(() => dayjs(props.user.createdAt).format('DD MMM YYYY'));
</script>

<template>
  <article
    class="group bg-surface border-border hover:border-primary/40 relative flex flex-col gap-4 rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
  >
    <!-- Identitas: avatar + nama + email -->
    <div class="flex items-start gap-3">
      <span
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        :style="gradient"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="text-text-primary truncate font-semibold">{{ user.name }}</h3>
        <p class="text-text-muted truncate text-sm">{{ user.email }}</p>
      </div>
      <button
        type="button"
        class="text-text-subtle hover:bg-bg-subtle hover:text-primary shrink-0 rounded-lg p-2 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
        :aria-label="`Edit ${user.name}`"
        @click="$emit('edit')"
      >
        <Pencil class="h-4 w-4" :stroke-width="1.8" />
      </button>
    </div>

    <!-- Meta: peran + tanggal bergabung -->
    <div class="border-border flex items-center justify-between border-t pt-3">
      <Badge :variant="userRoleVariant[user.role]">{{ userRoleLabel[user.role] }}</Badge>
      <span
        class="inline-flex items-center gap-1.5 text-xs font-medium"
        :class="user.isActive ? 'text-success' : 'text-text-subtle'"
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="user.isActive ? 'bg-success' : 'bg-text-subtle'"
        />
        {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
      </span>
    </div>

    <p class="text-text-subtle text-xs">Bergabung {{ joined }}</p>
  </article>
</template>
