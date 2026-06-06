# Menjalankan CMS Media (Backend + Panel Admin) + Dummy Data

Panduan menjalankan **dua proses** secara lokal:

| Bagian      | Folder        | Teknologi                 | URL dev                     |
| ----------- | ------------- | ------------------------- | --------------------------- |
| Backend API | `./` (`src/`) | NestJS + Prisma + Postgres | `http://localhost:3000/api/v1` |
| Panel Admin | `./admin/`    | Vue 3 + Vite + Tailwind v4 | `http://localhost:5173`     |

Auth memakai **httpOnly cookie** (token tak terbaca JS) + **CSRF double-submit**. Karena itu backend WAJIB mengizinkan origin SPA dan SPA WAJIB mengirim cookie (`withCredentials`). Keduanya sudah dikonfigurasi.

---

## 0. Prasyarat

- Node.js **>= 20**, npm **>= 10**
- PostgreSQL **16** (via Podman/Docker, atau native)

---

## 1. Backend API

```bash
# dari root repo (d:\Projects\cms-media)

# 1.1 Install dependency
npm install

# 1.2 Siapkan environment
copy .env.example .env        # Windows (PowerShell: Copy-Item .env.example .env)
# Pastikan CORS_ORIGINS memuat http://localhost:5173 (sudah default).
# Untuk dev cookie: COOKIE_SECURE=false, COOKIE_SAMESITE=lax (default).

# 1.3 Jalankan PostgreSQL (pilih salah satu)
#  a) Docker
docker compose up -d
#  b) Podman
podman run -d --name cms_media_postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cms_media \
  -p 5432:5432 -v cms_media_pgdata:/var/lib/postgresql/data \
  docker.io/library/postgres:16-alpine

# 1.4 Generate Prisma client + terapkan migration
#  (migrate dev otomatis membuat migration baru utk tabel `pages` bila belum ada,
#   sekaligus me-regenerate Prisma client)
npm run prisma:generate
npm run prisma:migrate     # jika diminta nama: gunakan "add_pages"

# 1.5 Isi DUMMY DATA (akun, kategori, tag, artikel, komentar, iklan, setting)
npm run prisma:seed

# 1.6 Jalankan server (watch)
npm run start:dev
```

API aktif di `http://localhost:3000/api/v1`. Dokumentasi OpenAPI: `http://localhost:3000/api/docs`.

---

## 2. Panel Admin (SPA)

Buka terminal **kedua** (biarkan backend tetap jalan):

```bash
cd admin

# 2.1 Install dependency
npm install

# 2.2 Environment (base URL backend)
copy .env.example .env        # isi: VITE_API_URL=http://localhost:3000/api/v1 (default)

# 2.3 Jalankan dev server
npm run dev
```

Buka `http://localhost:5173` → diarahkan ke halaman login.

> Build produksi SPA: `npm run build` (output `admin/dist/`). Cek tipe saja: `npm run typecheck`.

---

## 3. Akun Login (dari seed)

| Peran        | Email                          | Password        | Akses utama                              |
| ------------ | ------------------------------ | --------------- | ---------------------------------------- |
| ADMIN        | `admin@cms-media.local`        | `Admin12345!`   | Semua, termasuk Pengguna & Pengaturan    |
| EDITOR       | `editor@cms-media.local`       | `Editor12345!`  | Konten, moderasi komentar, iklan, publish |
| AUTHOR       | `author@cms-media.local`       | `Author12345!`  | Tulis artikel sendiri, media             |
| CONTRIBUTOR  | `kontributor@cms-media.local`  | `Kontrib12345!` | Tulis draf, ajukan review, media         |

> Email/password admin mengikuti `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` di `.env`. Akun non-admin memakai password di atas. **Ganti untuk lingkungan nyata.**

Menu yang tampil mengikuti peran (RBAC di UI). Otorisasi sebenarnya tetap divalidasi backend.

---

## 4. Isi Dummy Data

`npm run prisma:seed` bersifat **idempoten** (aman diulang). Yang dibuat:

- **4 akun** (admin/editor/author/kontributor).
- **Kategori berhierarki**: Ekonomi, Market, Tech, Lifestyle, News + anak (Makroekonomi, UMKM, Saham, Kripto, Gadget, AI).
- **8 tag**: Inflasi, BI Rate, Startup, IHSG, Bitcoin, Pemilu, Gawai, OpenAI.
- **8 artikel** beragam status: 5 `PUBLISHED` (tersebar 14 hari terakhir → grafik dashboard terisi), 1 `IN_REVIEW`, 1 `DRAFT`, 1 `SCHEDULED`, 1 `ARCHIVED`.
- **4 komentar** (approved/pending/spam) untuk menu Moderasi.
- **3 slot iklan** (`home_top`, `article_inline`, `sidebar_300x250`) + **3 creative** (HOUSE_IMAGE/ADSENSE/HOUSE_HTML).
- **7 setting** lintas group (general/seo/social) dengan beragam tipe (STRING/TEXT/NUMBER/BOOLEAN/URL).

- **4 laman statis** (menu **Laman**, terpisah dari Berita): Tentang, Syarat & Ketentuan, Kebijakan Privasi, Daftar Isi. Tiga terakhir ditandai **wajib** (tak bisa dihapus).
- **`frontend_url`** (group `general`) = basis URL situs publik PORA (FE). Dipakai pratinjau permalink di editor Berita/Laman: tautan klikable ke rute FE asli — Berita `/#/berita/:slug`, Laman `/#/:slug` (HashRouter).

> Catatan: dummy **tidak** menyertakan berkas Media (perlu unggah file nyata). Unggah lewat menu **Media** untuk mencobanya; gambar bisa dijadikan "Gambar Utama" artikel.

### Fitur konten ala WordPress

- **Halaman vs Artikel terpisah.** Artikel = berita (kategori/tag/komentar/workflow). **Halaman** = statis (Tentang, Syarat, dll) tanpa kategori/tag; halaman *wajib* tak bisa dihapus.
- **Permalink kustom** (menu **Permalink**, ADMIN): pilih preset atau tulis struktur sendiri dengan token `%postname%`, `%category%`, `%year%`, `%monthnum%`, `%day%`, `%id%`, `%pagename%`. Disimpan sebagai setting publik.
- **Preview permalink** muncul tepat di bawah judul pada editor Artikel & Halaman, mengikuti struktur tersimpan.
- **Tag terpisah dari Kategori** dengan halaman masing-masing; daftar Tag otomatis ber-**pagination** saat lebih dari 10.

Reset data (hapus + migrasi ulang + seed):

```bash
npx prisma migrate reset   # WIPE database lalu jalankan migrate + seed otomatis
```

---

## 5. Alur Uji Cepat

1. Login sebagai **author** → menu **Artikel** → **Tulis Artikel** → isi judul + body (editor blok) → **Simpan** → **Ajukan untuk Review**.
2. Login sebagai **editor** → buka artikel tadi → **Terbitkan Sekarang** atau **Jadwalkan**.
3. Buka **Dashboard** → KPI & grafik tren publikasi terisi dari dummy/aksi di atas.
4. Login sebagai **admin** → **Pengguna** (buat/edit role) & **Pengaturan** (ubah nilai, **Simpan Perubahan**).

---

## 6. Troubleshooting

- **401 terus / langsung balik ke login**: pastikan backend jalan di `:3000`, `CORS_ORIGINS` memuat `http://localhost:5173`, dan SPA pakai `VITE_API_URL` ber-`/api/v1`.
- **403 Forbidden saat mutasi (CSRF)**: cookie `csrf_token` di-seed otomatis pada request GET pertama. Cukup muat ulang halaman; jangan blokir cookie pihak-ketiga untuk `localhost`.
- **Cookie tak tersimpan**: di dev gunakan `COOKIE_SECURE=false` (HTTP). Di produksi (HTTPS) set `COOKIE_SECURE=true`; bila beda subdomain set `COOKIE_DOMAIN` dan `COOKIE_SAMESITE=none`.
- **Prisma error koneksi**: cek `DATABASE_URL` & container Postgres aktif (`docker compose ps`).
- **Port 5173/3000 dipakai**: hentikan proses lain atau ubah port (`admin/vite.config.ts` / `PORT` di `.env`).
