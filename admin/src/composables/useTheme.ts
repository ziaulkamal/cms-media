/** admin/src/composables/useTheme.ts — toggle & persist dark mode (class .dark di <html>). */
import { onMounted, ref, watch } from 'vue';

const STORAGE_KEY = 'cms-admin-theme';
const isDark = ref(false);

/** Terapkan/lepas class .dark pada root document. */
function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
}

/** Baca preferensi tersimpan, fallback ke preferensi sistem. */
function loadSavedTheme(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** State + aksi tema, dibagikan (singleton ref) ke seluruh komponen. */
export function useTheme() {
  onMounted(() => {
    isDark.value = loadSavedTheme();
    applyTheme(isDark.value);
  });

  watch(isDark, (val) => {
    applyTheme(val);
    localStorage.setItem(STORAGE_KEY, val ? 'dark' : 'light');
  });

  return {
    isDark,
    toggleTheme: () => (isDark.value = !isDark.value),
    setTheme: (dark: boolean) => (isDark.value = dark),
  };
}
