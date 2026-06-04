<!-- admin/src/pages/pages/Editor.vue — buat & edit halaman statis + preview permalink. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import BlockEditor from '@/components/articles/BlockEditor.vue';
import SeoPanel from '@/components/articles/SeoPanel.vue';
import PermalinkPreview from '@/components/common/PermalinkPreview.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import QueryState from '@/components/ui/QueryState.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useMediaMutations } from '@/composables/useMedia';
import { useMediaMeta } from '@/composables/useMediaMeta';
import { usePageDetail, usePageMutations } from '@/composables/usePages';
import { useToast } from '@/composables/useToast';
import { pageStatusLabel, toOptions } from '@/lib/labels';
import { parseFieldErrors } from '@/lib/validation';
import type { CreatePagePayload } from '@/types/cms';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const id = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!id.value);

const detail = usePageDetail(id);
const { create, update } = usePageMutations();
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

const title = ref('');
const slug = ref('');
const body = ref<Record<string, unknown>>({ type: 'doc', content: [] });
const status = ref('DRAFT');
const seoTitle = ref('');
const seoDescription = ref('');
const isMandatory = ref(false);
const fieldErrors = ref<Record<string, string>>({});

watch(
  () => detail.data.value,
  (p) => {
    if (!p) return;
    title.value = p.title;
    slug.value = p.slug;
    body.value = (p.body as Record<string, unknown>) ?? { type: 'doc', content: [] };
    status.value = p.status;
    seoTitle.value = p.seoTitle ?? '';
    seoDescription.value = p.seoDescription ?? '';
    isMandatory.value = p.isMandatory;
  },
  { immediate: true },
);

const saving = computed(() => create.isPending.value || update.isPending.value);

function buildPayload(): CreatePagePayload {
  return {
    title: title.value,
    slug: slug.value || undefined,
    body: body.value,
    status: status.value as CreatePagePayload['status'],
    seoTitle: seoTitle.value || undefined,
    seoDescription: seoDescription.value || undefined,
  };
}

async function onSave(): Promise<void> {
  fieldErrors.value = {};
  try {
    if (isEdit.value) {
      await update.mutateAsync({ id: id.value!, payload: buildPayload() });
      toast.success('Halaman tersimpan.');
    } else {
      const created = await create.mutateAsync(buildPayload());
      toast.success('Halaman dibuat.');
      await router.replace(`/pages/${created.id}/edit`);
    }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.details) fieldErrors.value = parseFieldErrors(e.details);
      toast.error(e.message);
    } else {
      toast.error('Gagal menyimpan halaman.');
    }
  }
}
</script>

<template>
  <div>
    <PageHeader :title="isEdit ? 'Edit Halaman' : 'Halaman Baru'">
      <template #actions>
        <Button variant="secondary" @click="router.push('/pages')">Kembali</Button>
        <Button :loading="saving" @click="onSave">Simpan</Button>
      </template>
    </PageHeader>

    <QueryState
      :loading="isEdit && detail.isLoading.value"
      :error="isEdit ? detail.error.value : undefined"
    >
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div class="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <div class="flex flex-col gap-2">
              <TextInput
                v-model="title"
                label="Judul"
                placeholder="Judul halaman"
                required
                :error="fieldErrors.title"
              />
              <PermalinkPreview type="page" :title="title" :slug-override="slug" />
            </div>
            <div class="mt-4 flex flex-col gap-4">
              <TextInput
                v-model="slug"
                label="Slug (opsional)"
                placeholder="dikosongkan = otomatis dari judul"
                :error="fieldErrors.slug"
              />
              <div class="flex flex-col gap-1.5">
                <label class="text-text-primary text-sm font-medium">Isi</label>
                <BlockEditor v-model="body" :upload-image="uploadInlineImage" />
              </div>
            </div>
          </Card>
          <SeoPanel
            v-model:seo-title="seoTitle"
            v-model:seo-description="seoDescription"
            :errors="fieldErrors"
          />
        </div>

        <div class="flex flex-col gap-5">
          <Card title="Publikasi">
            <div class="flex flex-col gap-3">
              <SelectInput
                v-model="status"
                label="Status"
                :allow-empty="false"
                :options="toOptions(pageStatusLabel)"
              />
              <div v-if="isMandatory" class="flex items-center gap-2">
                <Badge variant="warning">Halaman wajib</Badge>
                <span class="text-text-subtle text-xs">Tidak bisa dihapus.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </QueryState>
  </div>
</template>
