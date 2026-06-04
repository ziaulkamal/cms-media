# Catatan Database Produksi

Dokumen ini merangkum dua hal: hasil **review query plan** hot-path dan **strategi connection pooling** untuk produksi.

---

## 1. Review Query Plan (hot-path daftar artikel)

Diuji dengan ~3.000 artikel `PUBLISHED` (data sintetis, lalu dibersihkan) memakai `EXPLAIN (ANALYZE, BUFFERS)`.

### A. Daftar publik — `status=PUBLISHED ORDER BY published_at DESC LIMIT 20`

```
Limit (actual time=0.220..0.223 rows=20)
  -> Incremental Sort (Presorted Key: published_at)
       -> Index Scan using articles_status_published_at_idx
            Index Cond: (status = 'PUBLISHED')
Execution Time: 0.348 ms
```

- ✅ **Index `(status, published_at DESC)` dipakai** (Index Scan), bukan seq scan.
- ✅ Urutan utama (`published_at`) sudah *presorted* oleh index → hanya `Incremental Sort` ringan untuk tie-breaker `created_at`.
- ✅ `LIMIT 20` hanya menyentuh ~9 buffer. Sangat efisien meski tabel besar.

### B. Full-text search — `tsv @@ websearch_to_tsquery(...)`

Perilaku planner **bergantung selektivitas** kata kunci:

| Kueri | Cocok | Rencana | Catatan |
| --- | --- | --- | --- |
| kata umum (mis. "inflasi") | ~semua baris | **Seq Scan** | Benar — GIN tak menguntungkan saat hampir semua baris cocok |
| kata langka (mis. "melandai") | 1 baris | **Bitmap Index Scan `articles_tsv_idx`** (GIN) | ✅ Index dipakai, 0.278 ms |

- ✅ **GIN index `articles_tsv_idx` berfungsi** dan dipilih saat kueri selektif.
- Seq scan pada kata umum adalah keputusan planner yang tepat (bukan masalah index).

### Kesimpulan & tindak lanjut
- Index existing sudah tepat untuk pola query saat ini; **tidak ada perubahan index yang diperlukan** sekarang.
- Pemantauan ke depan:
  - Jalankan `ANALYZE` rutin (autovacuum biasanya cukup) agar statistik akurat.
  - Bila volume sangat besar & search jadi bottleneck, pertimbangkan **Elasticsearch/OpenSearch** (lihat roadmap Fase 9).
  - Waspadai **OFFSET besar** (pagination dalam): `OFFSET 100000` tetap memindai baris terlebih dahulu. Untuk arsip dalam, pertimbangkan **keyset pagination** (`WHERE published_at < :cursor`).

---

## 2. Connection Pooling untuk Produksi

PostgreSQL punya batas `max_connections` (default ~100). Banyak instance app / lingkungan serverless dapat dengan cepat menghabiskannya bila tiap koneksi langsung ke Postgres.

### Pola yang dipakai proyek ini

`prisma/schema.prisma` sudah menyiapkan dua URL:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // runtime (boleh lewat pooler)
  directUrl = env("DIRECT_URL")   // langsung — utk migrate/introspect
}
```

- **`DATABASE_URL`** — dipakai aplikasi saat runtime. Di produksi arahkan ke **PgBouncer** (mode `transaction`).
- **`DIRECT_URL`** — koneksi langsung ke Postgres (bukan pooler). `prisma migrate` butuh ini karena migration memakai session-level state yang tidak kompatibel dengan transaction pooling.

### Rekomendasi per lingkungan

**Server klasik (1–N instance terus hidup):**
- Cukup Prisma connection pool bawaan. Atur batas via query string:
  `DATABASE_URL=...?connection_limit=10&pool_timeout=20`
- Default Prisma `connection_limit` = `(jumlah_core * 2) + 1`. Sesuaikan agar `total instance * connection_limit < max_connections`.

**Serverless / banyak instance (Lambda, Cloud Run, Vercel):**
- **Wajib PgBouncer** (atau pooler bawaan provider, mis. Supabase/Neon pooler).
- PgBouncer **transaction mode**, lalu di `DATABASE_URL` tambahkan:
  `?pgbouncer=true&connection_limit=1`
  - `pgbouncer=true` → Prisma menonaktifkan prepared statements (tak didukung transaction pooling).
  - `connection_limit=1` → tiap fungsi serverless hanya butuh 1 koneksi.
- `DIRECT_URL` tetap menunjuk Postgres langsung untuk migrasi (dijalankan terpisah di pipeline, bukan saat cold start).

### Contoh `.env` produksi (serverless + PgBouncer)

```dotenv
DATABASE_URL="postgresql://user:pass@pgbouncer-host:6432/cms_media?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:pass@postgres-host:5432/cms_media"
```

### Checklist produksi
- [ ] `DATABASE_URL` lewat pooler; `DIRECT_URL` langsung ke Postgres.
- [ ] `connection_limit` disetel agar `instance * limit < max_connections`.
- [ ] Migrasi dijalankan di pipeline (pakai `DIRECT_URL`), bukan saat boot aplikasi.
- [ ] Pantau metrik koneksi (idle/active) & `pool_timeout`.
- [ ] Pertimbangkan health check DB (`GET /health`) di balik load balancer.
