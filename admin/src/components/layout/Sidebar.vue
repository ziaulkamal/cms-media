<!-- admin/src/components/layout/Sidebar.vue — navigasi samping gaya Admin_FE: brand gradient, active gradient, collapsible, aurora dark-mode. -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { navGroups, type NavItem } from '@/data/navGroups';
import { useAuthStore } from '@/stores/auth';

defineProps<{ collapsed?: boolean; mobileOpen?: boolean }>();

const auth = useAuthStore();
const route = useRoute();

/** Item terlihat bila tanpa batasan role atau role user diizinkan. */
function canSee(item: NavItem): boolean {
  return !item.roles || auth.hasRole(...item.roles);
}

/** Grup beserta item yang lolos filter; sembunyikan grup kosong. */
const visibleGroups = computed(() =>
  navGroups
    .map((g) => ({ ...g, items: g.items.filter(canSee) }))
    .filter((g) => g.items.length > 0),
);

/** Tandai item aktif (cocok persis untuk '/', prefix untuk lainnya). */
function isActive(to: string): boolean {
  if (to === '/') return route.path === '/';
  return route.path === to || route.path.startsWith(to + '/');
}

const initial = computed(() => auth.user?.name?.charAt(0).toUpperCase() ?? '?');
</script>

<template>
  <aside
    class="bg-sidebar-bg border-sidebar-border fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:shrink-0 lg:transition-[width]"
    :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    :style="{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }"
  >
    <!-- Aurora overlay (hanya dark mode) -->
    <div class="aurora hidden dark:block" aria-hidden="true">
      <span class="aurora__blob aurora__blob--1" />
      <span class="aurora__blob aurora__blob--2" />
      <span class="aurora__blob aurora__blob--3" />
    </div>

    <!-- Konten di atas aurora -->
    <div class="relative z-10 flex min-h-0 flex-1 flex-col">
      <!-- Brand -->
      <div class="flex h-14 shrink-0 items-center gap-3 px-4">
        <div class="brand-logo shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" fill="white" fill-opacity="0.95" />
            <circle cx="10" cy="10" r="3" fill="white" fill-opacity="0.5" />
          </svg>
        </div>
        <div v-if="!collapsed" class="min-w-0">
          <p class="text-text-primary truncate text-sm font-bold leading-tight">CMS Media</p>
          <p class="text-text-subtle truncate text-[11px] leading-tight">Panel Admin</p>
        </div>
      </div>

      <!-- Nav -->
      <nav
        class="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden py-2"
        :class="collapsed ? 'px-2' : 'px-3'"
      >
        <div
          v-for="group in visibleGroups"
          :key="group.label"
          :class="collapsed ? 'mb-2' : 'mb-1'"
        >
          <p
            v-if="!collapsed"
            class="text-primary px-2 pb-1 pt-4 text-[10.5px] font-extrabold uppercase tracking-[0.1em]"
          >
            {{ group.label }}
          </p>
          <!-- Collapsed: bungkus ikon jadi kartu grup membulat (konsep dari referensi) -->
          <ul class="space-y-0.5" :class="collapsed ? 'sidebar-icon-group' : ''">
            <li v-for="item in group.items" :key="item.to">
              <RouterLink
                :to="item.to"
                :title="collapsed ? item.label : undefined"
                class="nav-link"
                :class="[isActive(item.to) ? 'nav-link--active' : 'nav-link--default', collapsed ? 'nav-link--collapsed' : '']"
              >
                <component :is="item.icon" class="h-[18px] w-[18px] shrink-0" :stroke-width="1.8" />
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- User footer -->
      <div class="border-sidebar-border shrink-0 border-t p-3">
        <div class="flex items-center gap-2.5" :class="collapsed ? 'justify-center' : ''">
          <span class="avatar-gradient">{{ initial }}</span>
          <div v-if="!collapsed" class="min-w-0">
            <p class="text-text-primary truncate text-sm font-semibold leading-tight">
              {{ auth.user?.name }}
            </p>
            <p class="text-text-subtle truncate text-xs">{{ auth.role }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-violet) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glow);
}

.avatar-gradient {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-violet));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-sidebar-text);
  transition: background-color 130ms ease, color 130ms ease, box-shadow 130ms ease;
}

.nav-link--default:hover {
  background-color: rgba(99, 102, 241, 0.09);
  color: var(--color-text-primary);
}

.nav-link--active {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-violet) 100%);
  color: #fff;
  box-shadow: var(--shadow-glow);
}

/* Mode collapsed: tombol jadi kotak (ikon di tengah). */
.nav-link--collapsed {
  justify-content: center;
  padding: 9px;
}

/* Kartu grup ikon (collapsed) — surface membulat dengan shadow halus. */
.sidebar-icon-group {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 6px;
  box-shadow: var(--shadow-sm);
}
.dark .sidebar-icon-group {
  background-color: rgba(30, 41, 59, 0.6);
}

/* ── Aurora (dark mode) ── */
.aurora {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.aurora__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  will-change: transform;
}
.aurora__blob--1 {
  width: 220px;
  height: 220px;
  top: -40px;
  left: -60px;
  opacity: 0.55;
  background: radial-gradient(circle, #6366f1 0%, transparent 70%);
  animation: aurora-1 14s ease-in-out infinite alternate;
}
.aurora__blob--2 {
  width: 180px;
  height: 180px;
  top: 32%;
  right: -50px;
  opacity: 0.4;
  background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
  animation: aurora-2 18s ease-in-out infinite alternate;
}
.aurora__blob--3 {
  width: 200px;
  height: 200px;
  bottom: 60px;
  left: -30px;
  opacity: 0.3;
  background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
  animation: aurora-3 22s ease-in-out infinite alternate;
}

@keyframes aurora-1 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 40px) scale(1.15); }
  100% { transform: translate(10px, 80px) scale(0.9); }
}
@keyframes aurora-2 {
  0% { transform: translate(0, 0) scale(1); }
  40% { transform: translate(-20px, 30px) scale(1.2); }
  100% { transform: translate(15px, -50px) scale(0.85); }
}
@keyframes aurora-3 {
  0% { transform: translate(0, 0) scale(1); }
  60% { transform: translate(40px, -30px) scale(1.1); }
  100% { transform: translate(-10px, -60px) scale(1.25); }
}

@media (prefers-reduced-motion: reduce) {
  .aurora__blob { animation: none; }
}
</style>
