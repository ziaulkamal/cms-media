<!-- admin/src/layouts/BaseLayout.vue — shell terautentikasi: Sidebar collapsible (desktop) / drawer (mobile) + Topbar + konten. -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from '@/components/layout/Sidebar.vue';
import Topbar from '@/components/layout/Topbar.vue';

const STORAGE_KEY = 'cms-admin-sidebar-collapsed';
const collapsed = ref(localStorage.getItem(STORAGE_KEY) === 'true');
const mobileOpen = ref(false);
const isMobile = ref(false);

const route = useRoute();
let mql: MediaQueryList | undefined;

/** Sinkron status mobile; tutup drawer otomatis saat naik ke desktop. */
function syncMobile(e: MediaQueryList | MediaQueryListEvent): void {
  isMobile.value = e.matches;
  if (!e.matches) mobileOpen.value = false;
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 1023px)');
  syncMobile(mql);
  mql.addEventListener('change', syncMobile);
});
onUnmounted(() => mql?.removeEventListener('change', syncMobile));

// Tutup drawer setiap pindah halaman (mobile).
watch(() => route.path, () => { mobileOpen.value = false; });

/** Di mobile sidebar selalu tampil penuh; collapse hanya berlaku di desktop. */
const effectiveCollapsed = computed(() => (isMobile.value ? false : collapsed.value));

/** Toggle: di mobile buka/tutup drawer, di desktop ciutkan + simpan preferensi. */
function toggleSidebar(): void {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value;
  } else {
    collapsed.value = !collapsed.value;
    localStorage.setItem(STORAGE_KEY, String(collapsed.value));
  }
}
</script>

<template>
  <div class="bg-bg flex min-h-screen">
    <!-- Backdrop drawer (mobile) -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        aria-hidden="true"
        @click="mobileOpen = false"
      />
    </Transition>

    <Sidebar :collapsed="effectiveCollapsed" :mobile-open="mobileOpen" />

    <div class="flex min-h-screen min-w-0 flex-1 flex-col">
      <Topbar :collapsed="collapsed" @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
