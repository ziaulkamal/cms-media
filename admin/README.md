# CMS Media — Panel Admin (SPA)

SPA Vue 3 (Vite + TypeScript + Tailwind v4) yang memanggil NestJS API `@ /api/v1` langsung. Auth via httpOnly cookie + CSRF.

## Cepat

```bash
npm install
copy .env.example .env      # VITE_API_URL=http://localhost:3000/api/v1
npm run dev                 # http://localhost:5173
```

Backend harus jalan lebih dulu. Panduan lengkap + akun login + dummy data: [../docs/MENJALANKAN.md](../docs/MENJALANKAN.md).

## Script

| Perintah            | Fungsi                          |
| ------------------- | ------------------------------- |
| `npm run dev`       | Dev server (HMR)                |
| `npm run build`     | Typecheck (`vue-tsc`) + build   |
| `npm run preview`   | Pratinjau hasil build           |
| `npm run typecheck` | Cek tipe saja                   |

## Struktur

```
src/
├─ api/          # klien axios (http.ts) + endpoint per domain
├─ types/        # kontrak tipe (cms.ts)
├─ stores/       # Pinia (auth)
├─ composables/  # Vue Query per domain + usePagination/useFilters/useTheme/useToast
├─ components/   # ui/ (primitives), layout/, articles/, ads/, comments/, categories/, settings/, dashboard/
├─ layouts/      # AuthLayout, BaseLayout (sidebar+topbar)
├─ pages/        # route per domain
├─ data/         # navGroups (menu per role)
└─ router/       # route + guard auth/RBAC
```
