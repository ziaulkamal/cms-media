# CMS Media

Backend platform media berita (mirip CNBC Indonesia) — dibangun dengan **NestJS + TypeScript** dan **PostgreSQL**. Mengusung arsitektur **Modular Monolith** berlapis (Controller → Service → Repository) dengan prioritas keamanan, clean code, dan kode yang dapat digunakan ulang (DRY).

## Tech Stack

| Komponen        | Teknologi                          |
| --------------- | ---------------------------------- |
| Runtime         | Node.js 20+                        |
| Framework       | NestJS 10 (TypeScript)             |
| Database        | PostgreSQL 16                      |
| ORM             | Prisma 5                           |
| Auth            | JWT (access + refresh), RBAC       |
| Validasi        | class-validator + Joi (env)        |
| Media storage   | Local filesystem (abstraksi `StoragePort`, siap pindah ke S3) |
| Keamanan        | Helmet, CORS, Throttler (rate limit) |

## Arsitektur Singkat

```
Controller (presentation)  ->  Service (application)  ->  Repository (infrastructure)
   parse & validasi input        aturan bisnis & workflow      akses data (Prisma)
```

- Diorganisir **per domain** (`articles`, `users`, `media`, ...), bukan per tipe teknis.
- Dependency menunjuk ke dalam; controller tidak pernah mengakses DB langsung.
- Response & error dibungkus envelope seragam; kontrak API ber-versi (`/api/v1`).

```
src/
├─ config/      # env loader + validasi
├─ common/      # cross-cutting: filter, interceptor, guard, dto, errors
├─ modules/     # fitur per domain: auth, users, articles, categories, tags, media, comments
└─ prisma/      # PrismaService (koneksi DB)
prisma/
└─ schema.prisma  # sumber kebenaran skema DB
```

## Prasyarat

- Node.js >= 20
- npm >= 10
- PostgreSQL 16 — disarankan via **Podman** (ringan, tanpa Docker Desktop). Alternatif: Docker, atau PostgreSQL native.

## Menjalankan (Development)

```bash
# 1. Install dependencies
npm install

# 2. Siapkan environment
cp .env.example .env
# Edit .env: isi JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, dan DATABASE_URL bila perlu

# 3. Jalankan PostgreSQL — pilih salah satu:

#  a) Podman (ringan, direkomendasikan)
podman machine init   # sekali saja
podman machine start
podman run -d --name cms_media_postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cms_media \
  -p 5432:5432 -v cms_media_pgdata:/var/lib/postgresql/data \
  docker.io/library/postgres:16-alpine

#  b) Docker (jika sudah terpasang)
docker compose up -d

# 4. Generate Prisma client & jalankan migration
npm run prisma:generate
npm run prisma:migrate

# 5. Jalankan server (mode watch)
npm run start:dev
```

Server berjalan di `http://localhost:3000` dengan prefix `/api/v1`.

## Script

| Perintah                  | Fungsi                                  |
| ------------------------- | --------------------------------------- |
| `npm run start:dev`       | Jalankan server mode watch              |
| `npm run build`           | Build produksi ke `dist/`               |
| `npm run start:prod`      | Jalankan hasil build                    |
| `npm run prisma:migrate`  | Buat & terapkan migration (dev)         |
| `npm run prisma:studio`   | Buka Prisma Studio (GUI database)       |
| `npm run lint`            | Lint & perbaiki otomatis                |
| `npm run test`            | Jalankan unit test                      |

## Environment Variables

Lihat [.env.example](.env.example) untuk daftar lengkap. Variabel penting:

- `DATABASE_URL` — koneksi PostgreSQL
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — secret token (wajib, min. 16 karakter)
- `STORAGE_DRIVER` — `local` (default) atau `s3`
- `THROTTLE_TTL` / `THROTTLE_LIMIT` — konfigurasi rate limit

> **Catatan keamanan:** jangan pernah commit file `.env` yang berisi nilai rahasia asli.

## Status Pengembangan

- [x] Fondasi: config, common (error envelope, interceptor, validasi), Prisma schema
- [ ] Modul Auth + Users (RBAC, JWT)
- [ ] Modul Articles (editorial workflow + full-text search)
- [ ] Modul Categories + Tags
- [ ] Modul Media (upload)
- [ ] Modul Comments (moderasi)

## Lisensi

UNLICENSED — penggunaan internal.
