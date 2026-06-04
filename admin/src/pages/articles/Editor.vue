<!-- admin/src/pages/articles/Editor.vue — buat & edit artikel; rangkai panel & workflow. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import { ArrowLeft, FolderTree, Save } from 'lucide-vue-next';
import BlockEditor from '@/components/articles/BlockEditor.vue';
import MediaPicker from '@/components/articles/MediaPicker.vue';
import PublishPanel from '@/components/articles/PublishPanel.vue';
import PermalinkPreview from '@/components/common/PermalinkPreview.vue';
import RevisionList from '@/components/articles/RevisionList.vue';
import SeoPanel from '@/components/articles/SeoPanel.vue';
import TagSelect from '@/components/articles/TagSelect.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { articleStatusLabel, articleStatusVariant } from '@/lib/labels';
import {
  useArticleDetail,
  useArticleMutations,
} from '@/composables/useArticles';
import { useCategoriesQuery } from '@/composables/useCategories';
import { useMediaMutations } from '@/composables/useMedia';
import { useMediaMeta } from '@/composables/useMediaMeta';
import { useToast } from '@/composables/useToast';
import { parseFieldErrors } from '@/lib/validation';
import { useAuthStore } from '@/stores/auth';
import type { CreateArticlePayload } from '@/types/cms';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const auth = useAuthStore();

const id = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!id.value);
const canPublish = computed(() => auth.hasRole('ADMIN', 'EDITOR'));

const detail = useArticleDetail(id);
const { data: categories } = useCategoriesQuery();
const { create, update, submit, publish, archive } = useArticleMutations();
const { upload: uploadMedia } = useMediaMutations();
const { editMedia } = useMediaMeta();

/** Unggah gambar inline → isi metadata (popup) → kembalikan url + alt untuk disisipkan. */
async function uploadInlineImage(
  file: File,
): Promise<{ url: string; alt: string | null } | null> {
  try {
    const media = await uploadMedia.mutateAsync({ file });
    const edited = await editMedia(media);
    return { url: edited.url, alt: edited.alt };
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Gagal mengunggah gambar.');
    return null;
  }
}

// --- Form state ---
const title = ref('');
const body = ref<Record<string, unknown>>({ type: 'doc', content: [] });
const excerpt = ref('');
const categoryId = ref('');
const featuredMediaId = ref<string | undefined>(undefined);
const tagIds = ref<string[]>([]);
const seoTitle = ref('');
const seoDescription = ref('');
const seoKeywords = ref<string[]>([]);
const fieldErrors = ref<Record<string, string>>({});

const status = computed(() => detail.data.value?.status ?? null);
const previewUrl = computed(() => detail.data.value?.featuredMedia?.url ?? null);
const categoryOptions = computed(() =>
  (categories.value ?? []).map((c) => ({ value: c.id, label: c.name })),
);
const selectedCategorySlug = computed(
  () => (categories.value ?? []).find((c) => c.id === categoryId.value)?.slug,
);

// Isi form saat artikel termuat (mode edit).
watch(
  () => detail.data.value,
  (a) => {
    if (!a) return;
    title.value = a.title;
    body.value = (a.body as Record<string, unknown>) ?? { type: 'doc', content: [] };
    excerpt.value = a.excerpt ?? '';
    categoryId.value = a.category?.id ?? '';
    featuredMediaId.value = a.featuredMedia?.id;
    tagIds.value = a.tags.map((t) => t.id);
    seoTitle.value = a.seoTitle ?? '';
    seoDescription.value = a.seoDescription ?? '';
    seoKeywords.value = a.seoKeywords ?? [];
  },
  { immediate: true },
);

/** Rakit payload dari state form (buang field kosong). */
function buildPayload(): CreateArticlePayload {
  return {
    title: title.value,
    body: body.value,
    excerpt: excerpt.value || undefined,
    categoryId: categoryId.value || undefined,
    featuredMediaId: featuredMediaId.value || undefined,
    tagIds: tagIds.value.length ? tagIds.value : undefined,
    seoTitle: seoTitle.value || undefined,
    seoDescription: seoDescription.value || undefined,
    seoKeywords: seoKeywords.value.length ? seoKeywords.value : undefined,
  };
}

const saving = computed(() => create.isPending.value || update.isPending.value);

/** Simpan: create lalu pindah ke mode edit, atau update di tempat. */
async function onSave(): Promise<void> {
  fieldErrors.value = {};
  try {
    if (isEdit.value) {
      await update.mutateAsync({ id: id.value!, payload: buildPayload() });
      toast.success('Perubahan tersimpan.');
    } else {
      const created = await create.mutateAsync(buildPayload());
      toast.success('Artikel dibuat.');
      await router.replace(`/articles/${created.id}/edit`);
    }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.details) fieldErrors.value = parseFieldErrors(e.details);
      toast.error(e.message);
    } else {
      toast.error('Gagal menyimpan artikel.');
    }
  }
}

const workflowBusy = computed(
  () => submit.isPending.value || publish.isPending.value || archive.isPending.value,
);

/** Bungkus aksi workflow dengan toast. */
async function runWorkflow(action: Promise<unknown>, ok: string): Promise<void> {
  try {
    await action;
    toast.success(ok);
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Aksi gagal.');
  }
}
</script>

<template>
  <div>
    <!-- Toolbar aksi (sticky) -->
    <div
      class="border-border bg-bg/80 sticky top-0 z-20 -mx-6 -mt-6 mb-8 border-b px-6 py-3 backdrop-blur"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Kembali ke daftar"
            class="border-border bg-surface text-text-muted hover:text-text-primary hover:border-border-strong flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors"
            @click="router.push('/articles')"
          >
            <ArrowLeft class="h-4.5 w-4.5" />
          </button>
          <div class="min-w-0">
            <h1 class="text-text-primary truncate text-lg font-semibold tracking-tight">
              {{ isEdit ? 'Edit Artikel' : 'Tulis Artikel' }}
            </h1>
            <p class="text-text-subtle truncate text-xs">
              {{ isEdit ? 'Perbarui konten lalu simpan perubahan.' : 'Konten baru — simpan untuk mengaktifkan publikasi.' }}
            </p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Badge v-if="status" :variant="articleStatusVariant[status]" class="hidden sm:inline-flex">
            {{ articleStatusLabel[status] }}
          </Badge>
          <Button variant="secondary" @click="router.push('/articles')">Kembali</Button>
          <Button :loading="saving" @click="onSave">
            <Save class="h-4 w-4" />
            Simpan
          </Button>
        </div>
      </div>
    </div>

    <QueryState
      :loading="isEdit && detail.isLoading.value"
      :error="isEdit ? detail.error.value : undefined"
    >
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Kolom utama (sticky: ikut saat konten di-scroll) -->
        <div class="flex flex-col gap-5 lg:col-span-2 lg:sticky lg:top-[72px] lg:self-start">
          <Card>
            <div class="flex flex-col gap-5">
              <div class="flex flex-col gap-2">
                <input
                  v-model="title"
                  type="text"
                  placeholder="Judul artikel…"
                  class="text-text-primary placeholder:text-text-subtle w-full border-0 bg-transparent p-0 text-2xl font-semibold leading-tight tracking-tight outline-none"
                />
                <p v-if="fieldErrors.title" class="text-danger text-xs">{{ fieldErrors.title }}</p>
                <PermalinkPreview type="article" :title="title" :category="selectedCategorySlug" />
              </div>

              <div class="border-border flex flex-col gap-2 border-t pt-5">
                <label class="text-text-primary text-sm font-medium">Isi Konten</label>
                <BlockEditor v-model="body" :upload-image="uploadInlineImage" />
              </div>

              <div class="border-border border-t pt-5">
                <TextInput
                  v-model="excerpt"
                  label="Ringkasan"
                  placeholder="Ringkasan singkat untuk daftar & pratinjau (opsional)"
                  :error="fieldErrors.excerpt"
                />
              </div>
            </div>
          </Card>
          <SeoPanel
            v-model:seo-title="seoTitle"
            v-model:seo-description="seoDescription"
            v-model:seo-keywords="seoKeywords"
            enable-keywords
            :errors="fieldErrors"
          />
        </div>

        <!-- Sidebar (sticky: ikut saat konten di-scroll) -->
        <div class="flex flex-col gap-5 lg:sticky lg:top-[72px] lg:self-start">
          <PublishPanel
            :status="status"
            :can-manage-publish="canPublish"
            :busy="workflowBusy"
            :locked-reason="isEdit ? undefined : 'Simpan artikel dulu untuk mengatur publikasi.'"
            @submit="runWorkflow(submit.mutateAsync(id!), 'Artikel diajukan untuk review.')"
            @publish="(p) => runWorkflow(publish.mutateAsync({ id: id!, payload: p }), 'Artikel diterbitkan/dijadwalkan.')"
            @archive="runWorkflow(archive.mutateAsync(id!), 'Artikel diarsipkan.')"
          />
          <Card title="Kategori" :icon="FolderTree">
            <SelectInput
              v-model="categoryId"
              :options="categoryOptions"
              placeholder="Tanpa kategori"
            />
          </Card>
          <MediaPicker v-model="featuredMediaId" :preview-url="previewUrl" />
          <TagSelect v-model="tagIds" />
          <RevisionList v-if="isEdit" :article-id="id" />
        </div>
      </div>
    </QueryState>
  </div>
</template>
