<!-- admin/src/components/layout/Topbar.vue — bar atas gaya Admin_FE: toggle, search ⌘K, tema, avatar dropdown. -->
<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { ChevronDown, LogOut, Moon, PanelLeft, Search, Sun } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from '@/composables/useTheme';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';

defineProps<{ collapsed?: boolean }>();
const emit = defineEmits<{ 'toggle-sidebar': [] }>();

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();
const { isDark, toggleTheme } = useTheme();

const initial = computed(() => auth.user?.name?.charAt(0).toUpperCase() ?? '?');

// ── Search (⌘K / Ctrl+K) ──
const searchInput = ref<HTMLInputElement | null>(null);
const query = ref('');
const focused = ref(false);

/** Enter → buka daftar artikel ter-filter kata kunci. */
function submitSearch(): void {
  const q = query.value.trim();
  if (!q) return;
  void router.push({ path: '/articles', query: { q } });
  searchInput.value?.blur();
}

/** Tangkap ⌘K / Ctrl+K secara global untuk fokus ke search. */
function onKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInput.value?.focus();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

async function onLogout(): Promise<void> {
  await auth.logout();
  toast.info('Anda telah keluar.');
  await router.replace('/login');
}
</script>

<template>
  <header
    class="border-topbar-border bg-topbar-bg sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b px-3"
  >
    <!-- Kiri: toggle + search -->
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <button
        type="button"
        class="text-text-muted hover:bg-bg-subtle rounded-lg p-2 transition-colors"
        :aria-label="collapsed ? 'Buka sidebar' : 'Tutup sidebar'"
        @click="emit('toggle-sidebar')"
      >
        <PanelLeft class="h-[19px] w-[19px]" :stroke-width="1.7" />
      </button>

      <div
        class="search-box hidden items-center gap-2 sm:flex"
        :class="focused ? 'search-box--focused' : ''"
      >
        <Search class="text-text-subtle h-3.5 w-3.5 shrink-0" />
        <input
          ref="searchInput"
          v-model="query"
          class="text-text-primary placeholder:text-text-subtle min-w-0 flex-1 border-none bg-transparent text-[13px] outline-none"
          placeholder="Cari artikel…"
          @focus="focused = true"
          @blur="focused = false"
          @keydown.enter="submitSearch"
          @keydown.escape="query = ''; searchInput?.blur()"
        />
        <kbd
          v-if="!focused && !query"
          class="text-text-subtle bg-border shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] leading-none"
        >
          ⌘K
        </kbd>
      </div>
    </div>

    <!-- Kanan: tema + user -->
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="text-text-muted hover:bg-bg-subtle rounded-lg p-2 transition-colors"
        :aria-label="isDark ? 'Mode terang' : 'Mode gelap'"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" class="h-[18px] w-[18px]" :stroke-width="1.7" />
        <Moon v-else class="h-[18px] w-[18px]" :stroke-width="1.7" />
      </button>

      <div class="bg-border mx-1 hidden h-5 w-px sm:block" />

      <Menu as="div" class="relative">
        <MenuButton class="hover:bg-bg-subtle flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors">
          <span class="avatar-gradient">{{ initial }}</span>
          <div class="hidden text-left sm:block">
            <p class="text-text-primary text-[12.5px] font-semibold leading-tight">{{ auth.user?.name }}</p>
            <p class="text-text-muted text-[10.5px] leading-tight">{{ auth.user?.email }}</p>
          </div>
          <ChevronDown class="text-text-subtle hidden h-3.5 w-3.5 sm:block" :stroke-width="2.5" />
        </MenuButton>
        <MenuItems
          class="bg-surface border-border absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border shadow-lg focus:outline-none"
        >
          <div class="flex items-center gap-2.5 px-4 py-3">
            <span class="avatar-gradient">{{ initial }}</span>
            <div class="min-w-0">
              <p class="text-text-primary truncate text-[13px] font-bold">{{ auth.user?.name }}</p>
              <p class="text-text-muted truncate text-[11px]">{{ auth.role }}</p>
            </div>
          </div>
          <div class="bg-border h-px" />
          <div class="p-1.5">
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]"
                :class="active ? 'bg-danger-light text-danger' : 'text-danger'"
                @click="onLogout"
              >
                <LogOut class="h-4 w-4" />
                Keluar
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>
    </div>
  </header>
</template>

<style scoped>
.avatar-gradient {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-violet));
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.search-box {
  height: 34px;
  width: 100%;
  max-width: 240px;
  padding: 0 10px;
  border: 1.5px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-bg-subtle);
  transition: max-width 200ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}
.search-box--focused {
  max-width: 320px;
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
</style>
