#!/bin/sh
# ---- Entrypoint CMS (runtime) ----
# Migrasi DB dijalankan oleh service one-shot "cms-migrate" (prisma migrate
# deploy) sebelum service ini start, sehingga runtime tetap ramping & tak ada
# balapan migrasi saat scaling. Di sini cukup jalankan aplikasinya.
set -e
exec "$@"
