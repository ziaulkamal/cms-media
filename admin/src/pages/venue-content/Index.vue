<!--
  admin/src/pages/venue-content/Index.vue — foto & deskripsi venue.
  Daftar venue = data panel SIMPORA (simpora2026); venue baru di panel otomatis
  muncul di sini. Admin web cukup memberi foto (deskripsi opsional).
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Camera, ImageOff, MapPin, Trash2, X } from 'lucide-vue-next';
import { ApiError } from '@/api/http';
import { mediaApi } from '@/api/media';
import Alert from '@/components/ui/Alert.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import Dropzone from '@/components/ui/Dropzone.vue';
import Modal from '@/components/ui/Modal.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import Textarea from '@/components/ui/Textarea.vue';
import { useConfirm } from '@/composables/useConfirm';
import {
  useVenueContentMutations,
  useVenueContentQuery,
  useVenueSourcesQuery,
} from '@/composables/useVenueContent';
import { useToast } from '@/composables/useToast';
import type { VenueContent } from '@/types/cms';

const toast = useToast();
const { confirm } = useConfirm();
const contents = useVenueContentQuery();
const sources = useVenueSourcesQuery();
const m = useVenueContentMutations();

/** Satu baris: venue panel + konten CMS-nya (bila sudah ada). */
interface VenueRow {
  ref: string;
  name: string;
  lokasi: string;
  cabor: number;
  content?: VenueContent;
}

const contentByRef = computed(
  () => new Map((contents.data.value ?? []).map((c) => [c.venueRef, c])),
);

/** Venue panel (toleran skema: id + name + address/wilayah). */
const rows = computed<VenueRow[]>(() =>
  (sources.data.value?.venues ?? [])
    .map((v) => {
      const o = (v ?? {}) as Record<string, any>;
      const ref = String(o.id ?? '');
      return {
        ref,
        name: String(o.name ?? ref),
        lokasi: String(o.address ?? o.wilayah?.nama ?? ''),
        cabor: Number(o.sport_categories_count ?? 0),
        content: contentByRef.value.get(ref),
      };
    })
    .filter((r) => r.ref),
);

const panelOk = computed(() => !!sources.data.value?.available);
const withPhoto = computed(() => rows.value.filter((r) => r.content?.imageUrl).length);
/** Konten yang venue-nya tak lagi ada/aktif di panel (tak tampil di situs publik). */
const orphans = computed(() => {
  if (!panelOk.value) return [];
  const refs = new Set(rows.value.map((r) => r.ref));
  return (contents.data.value ?? []).filter((c) => !refs.has(c.venueRef));
});

// --- Form foto venue ---
const formOpen = ref(false);
const formName = ref('');
const uploading = ref(false);
const uploadingGallery = ref(false);
const form = reactive({
  venueRef: '',
  description: '',
  /** undefined = foto utama tak diubah; null = dilepas; string = foto baru. */
  imageMediaId: undefined as string | null | undefined,
  imageUrl: null as string | null,
  gallery: [] as string[],
  galleryVisible: true,
});

/** Normalisasi gallery JSON (string[] atau {url}[]) → array URL. */
function toGalleryUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g) => (typeof g === 'string' ? g : (g as { url?: string })?.url ?? ''))
    .filter(Boolean);
}

function openForm(ref: string, name: string, c?: VenueContent): void {
  formName.value = name;
  Object.assign(form, {
    venueRef: ref,
    description: c?.description ?? '',
    imageMediaId: undefined,
    imageUrl: c?.imageUrl ?? null,
    gallery: toGalleryUrls(c?.gallery),
    galleryVisible: c?.galleryVisible ?? true,
  });
  formOpen.value = true;
}

/** Unggah foto utama venue ke Media, simpan id + preview. */
async function onImage(files: File[]): Promise<void> {
  uploading.value = true;
  try {
    const media = await mediaApi.upload(files[0]);
    form.imageMediaId = media.id;
    form.imageUrl = media.url;
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengunggah foto.');
  } finally {
    uploading.value = false;
  }
}

function clearImage(): void {
  form.imageMediaId = null;
  form.imageUrl = null;
}

/** Unggah beberapa foto galeri venue; tambahkan URL-nya ke form. */
async function onGallery(files: File[]): Promise<void> {
  uploadingGallery.value = true;
  try {
    const uploaded = await Promise.all(files.map((f) => mediaApi.upload(f)));
    form.gallery.push(...uploaded.map((mm) => mm.url));
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengunggah galeri.');
  } finally {
    uploadingGallery.value = false;
  }
}

function removeGallery(i: number): void {
  form.gallery.splice(i, 1);
}

async function onSubmit(): Promise<void> {
  try {
    await m.upsert.mutateAsync({
      venueRef: form.venueRef,
      description: form.description.trim(),
      imageMediaId: form.imageMediaId,
      gallery: form.gallery,
      galleryVisible: form.galleryVisible,
    });
    formOpen.value = false;
    toast.success(`Foto venue "${formName.value}" disimpan.`);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menyimpan.');
  }
}

async function onRemove(ref: string, name: string): Promise<void> {
  const ok = await confirm({
    title: 'Hapus foto & deskripsi',
    message: `Foto dan deskripsi untuk "${name}" dihapus dari situs publik. Data venue di panel tidak terpengaruh; file tetap di pustaka Media.`,
    confirmText: 'Hapus',
    danger: true,
  });
  if (!ok) return;
  try {
    await m.remove.mutateAsync(ref);
    toast.success('Foto & deskripsi venue dihapus.');
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal menghapus.');
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Venue"
      subtitle="Daftar venue diambil otomatis dari panel SIMPORA. Tambahkan foto agar tampil menarik di situs publik."
    />

    <QueryState :loading="sources.isLoading.value || contents.isLoading.value" :error="contents.error.value">
      <Alert v-if="!panelOk" variant="warning" class="mb-4">
        Daftar venue dari panel SIMPORA tidak dapat diambil saat ini. Coba muat ulang halaman beberapa saat lagi.
      </Alert>

      <template v-else>
        <p class="text-text-muted mb-4 text-sm">
          {{ withPhoto }} dari {{ rows.length }} venue sudah berfoto.
          Venue baru ditambahkan lewat menu Venue di panel.poraxv.id; di sini hanya foto & deskripsi.
        </p>

        <Alert v-if="rows.length === 0" variant="info" class="mb-4">
          Belum ada venue aktif di panel SIMPORA. Setelah panitia menambahkan venue di panel, venue muncul di sini otomatis.
        </Alert>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card v-for="r in rows" :key="r.ref">
            <div class="flex gap-4">
              <img
                v-if="r.content?.imageUrl"
                :src="r.content.imageUrl"
                :alt="r.name"
                class="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
              <span
                v-else
                class="bg-bg-subtle text-text-subtle flex h-20 w-20 shrink-0 items-center justify-center rounded-lg"
              >
                <ImageOff class="h-6 w-6" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-text-primary truncate text-sm font-semibold">{{ r.name }}</p>
                <p v-if="r.lokasi" class="text-text-muted mt-0.5 flex items-center gap-1 truncate text-xs">
                  <MapPin class="h-3.5 w-3.5 shrink-0" /> {{ r.lokasi }}
                </p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <Badge :variant="r.content?.imageUrl ? 'success' : 'warning'">
                    {{ r.content?.imageUrl ? 'Berfoto' : 'Belum ada foto' }}
                  </Badge>
                  <Badge v-if="toGalleryUrls(r.content?.gallery).length" variant="neutral">
                    Galeri {{ toGalleryUrls(r.content?.gallery).length }}
                  </Badge>
                  <Badge v-if="r.cabor" variant="neutral">{{ r.cabor }} sub-cabor</Badge>
                </div>
                <div class="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" @click="openForm(r.ref, r.name, r.content)">
                    <Camera class="h-4 w-4" /> Atur foto
                  </Button>
                  <Button v-if="r.content" size="sm" variant="ghost" @click="onRemove(r.ref, r.name)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Konten yatim: venue sudah dihapus/nonaktif di panel -->
        <div v-if="orphans.length" class="mt-8">
          <h2 class="text-text-primary text-sm font-semibold">Tidak ada lagi di panel</h2>
          <p class="text-text-muted mb-3 text-sm">
            Venue berikut sudah dihapus atau dinonaktifkan di panel, jadi fotonya tidak tampil di situs publik. Hapus bila tidak diperlukan.
          </p>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="c in orphans"
              :key="c.id"
              size="sm"
              variant="ghost"
              @click="onRemove(c.venueRef, `venue #${c.venueRef}`)"
            >
              <Trash2 class="h-4 w-4" /> venue #{{ c.venueRef }}
            </Button>
          </div>
        </div>
      </template>
    </QueryState>

    <!-- Form foto venue -->
    <Modal v-model:open="formOpen" :title="`Foto Venue — ${formName}`">
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-text-primary text-sm font-medium">Foto utama</span>
            <button
              v-if="form.imageUrl"
              type="button"
              class="text-danger text-xs font-medium hover:underline"
              @click="clearImage"
            >
              Hapus foto utama
            </button>
          </div>
          <img
            v-if="form.imageUrl"
            :src="form.imageUrl"
            alt="Pratinjau"
            class="h-40 w-full rounded-lg object-cover"
          />
          <Dropzone :busy="uploading" :multiple="false" @files="onImage" />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-text-primary text-sm font-medium">Galeri foto (opsional)</span>
            <label class="text-text-primary flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="form.galleryVisible" class="accent-primary size-4 rounded" />
              Tampilkan di situs
            </label>
          </div>
          <div v-if="form.gallery.length" class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <div v-for="(g, i) in form.gallery" :key="i" class="group relative">
              <img :src="g" alt="Foto galeri" class="aspect-square w-full rounded-lg object-cover" />
              <button
                type="button"
                aria-label="Buang foto"
                class="bg-danger absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full text-white opacity-0 transition group-hover:opacity-100"
                @click="removeGallery(i)"
              >
                <X class="size-3.5" />
              </button>
            </div>
          </div>
          <Dropzone :busy="uploadingGallery" :multiple="true" @files="onGallery" />
        </div>

        <Textarea
          v-model="form.description"
          label="Deskripsi (opsional)"
          placeholder="Ceritakan singkat venue ini untuk pengunjung situs."
          :rows="4"
        />
      </form>
      <template #footer>
        <Button variant="secondary" @click="formOpen = false">Batal</Button>
        <Button :loading="m.upsert.isPending.value" :disabled="uploading || uploadingGallery" @click="onSubmit">
          Simpan
        </Button>
      </template>
    </Modal>
  </div>
</template>
