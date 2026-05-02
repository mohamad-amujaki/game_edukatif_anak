# Game Edukatif Anak

Game edukatif berbasis web untuk anak **TK (4–6 tahun)** dan **SD kelas I (7–8 tahun)** dengan fokus **literasi dasar** dan **matematika dasar** dalam Bahasa Indonesia.

## Menjalankan proyek (development)

Membutuhkan **dua proses**: API Hono (port 3000) dan Vite (port 5173). Proxy `/api` dari Vite mengarah ke API.

```bash
pnpm install
pnpm exec prisma migrate dev # pertama kali / setelah ubah schema (butuh DATABASE_URL)
pnpm db:seed                 # konten level, stiker, badge
pnpm dev                     # menjalankan API + frontend bersamaan
```

Buka **http://localhost:5173**.

- Buat profil anak (TK atau SD-1), lalu main dari dashboard.
- Orang tua: tautan **Orang tua** → setup PIN 4 digit (pertama kali) atau masuk dengan PIN → laporan ringkas.

## Stack teknis

| Lapisan   | Teknologi                                      |
| --------- | ---------------------------------------------- |
| Frontend  | Vite, React 19, TanStack Router, Jotai, Tailwind CSS v4 |
| Backend   | Hono (`/api`), Node `@hono/node-server`       |
| Data      | Prisma + PostgreSQL (`DATABASE_URL`)        |
| Validasi  | Zod (server), kontrak di `docs/api-contracts.md` |

**API client (frontend):** permintaan ke `/api/*` memakai **Hono RPC** — `export type AppType` di `server/app.ts` (disnapshot sebelum mount wildcard better-auth), klien di [`src/lib/hono-client.ts`](src/lib/hono-client.ts), pembungkus domain di [`src/api.ts`](src/api.ts) dan [`src/api-admin.ts`](src/api-admin.ts). Ini menyelaraskan path dengan server tanpa menduplikasi string URL.

> Catatan: Dokumen PRD menyebut **TanStack Start**; implementasi saat ini memakai **Vite + TanStack Router + Hono** terpisah agar stabil dan mudah di-deploy. Perilaku produk mengikuti PRD di folder `docs/`.

## Deploy frontend (Netlify)

**Domain produksi:** [https://game-edukatif-anak.netlify.app/](https://game-edukatif-anak.netlify.app/)

- Konfigurasi build ada di [`netlify.toml`](netlify.toml) (build → `dist`, fallback SPA).
- Origin tersebut sudah termasuk di [`server/allowed-origins.ts`](server/allowed-origins.ts) untuk **CORS** dan **Better Auth** `trustedOrigins`. Tambahan domain/staging: set env **`CORS_ORIGINS`** di server API (pisahkan dengan koma).
- Di **Netlify → Site settings → Environment variables → Build**: jika API Hono di-host **terpisah** (bukan proxy sama-origin), set **`VITE_API_URL`** ke URL publik API (mis. `https://api-anda.com`). Kalau nanti `/api` di-proxy ke backend lewat Netlify redirects, biarkan kosong; klien memakai `window.location.origin` ([`src/lib/auth-client.ts`](src/lib/auth-client.ts)).
- Pada **server API** produksi: set **`BETTER_AUTH_URL`** ke URL publik tempat endpoint `/api/auth/*` diakses, dan **`BETTER_AUTH_SECRET`** (≥32 karakter).

## Deploy API (Railway) — Hono + PostgreSQL

1. **Buat project & service** di [Railway](https://railway.app/), hubungkan repo Git yang sama, **Root directory** biarkan root (atau sesuaikan jika monorepo).
2. **Build & start** sudah disetel di [`railway.toml`](railway.toml): build hanya `prisma generate`, start menjalankan `prisma migrate deploy` lalu API (lihat skrip **`start`** di `package.json`). Server mendengarkan **`PORT`** (otomatis dari Railway) — lihat [`server/index.ts`](server/index.ts).
3. **Variabel lingkungan** (tab *Variables* service API):

   | Variabel | Keterangan |
   |----------|------------|
   | `DATABASE_URL` | Connection string PostgreSQL (mis. dari plugin Postgres Railway, atau hostmanaged seperti Prisma Postgres). Harus pakai `sslmode=require` jika penyedia mensyaratkan TLS. |
   | `BETTER_AUTH_URL` | URL publik Railway service ini, mis. `https://xxx.up.railway.app` (tanpa slash akhir). |
   | `BETTER_AUTH_SECRET` | Minimal 32 karakter (acak). |
   | `PIN_HASH_PEPPER` | Sama seperti lokal; jangan kosong di produksi. |
   | `CORS_ORIGINS` | Opsional; domain Netlify sudah default di kode. |

4. **Seed sekali** (opsional): Railway → service → **Shell** / one-off command: `pnpm exec tsx prisma/seed.ts` (setelah migrasi sukses).

5. **Frontend Netlify:** set **`VITE_API_URL`** ke URL publik API Railway agar browser memanggil origin yang benar.

## Deploy API (Fly.io) — Hono + PostgreSQL

Prasyarat: [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) terpasang dan sudah `fly auth login`.

1. **Inisialisasi app** (sekali, dari root repo):

   ```bash
   fly launch --dockerfile Dockerfile --no-deploy
   ```

   Sesuaikan nama app dan region jika diminta. Field **`app`** di [`fly.toml`](fly.toml) harus sama dengan app Fly Anda.

2. **Secrets** (sama seperti backend lain — tidak di-commit):

   ```bash
   fly secrets set \
     DATABASE_URL="postgresql://..." \
     BETTER_AUTH_URL="https://<app>.fly.dev" \
     BETTER_AUTH_SECRET="<minimal-32-karakter>" \
     PIN_HASH_PEPPER="<acak-kuat>"
   ```

   **`BETTER_AUTH_URL`** harus persis URL publik Fly tempat `/api/auth/*` diakses (biasanya `https://<nama-app>.fly.dev`). Tambahkan **`CORS_ORIGINS`** jika perlu domain tambahan (pisahkan koma).

3. **Deploy:**

   ```bash
   fly deploy
   ```

4. **Cek:** `curl https://<nama-app>.fly.dev/api/health` harus mengembalikan JSON sukses.

5. **Frontend Netlify:** set **`VITE_API_URL`** ke `https://<nama-app>.fly.dev`.

Image memakai [`Dockerfile`](Dockerfile) (API saja: `pnpm install --prod`, `prisma generate`, `pnpm start`). Health check Fly mengarah ke **`/api/health`** ([`fly.toml`](fly.toml)).

## Dokumentasi produk

| Dokumen                                 | Isi                              |
| --------------------------------------- | -------------------------------- |
| [docs/PRD.md](docs/PRD.md)              | Requirement & alur pengguna      |
| [docs/architecture.md](docs/architecture.md) | Arsitektur target             |
| [docs/database-schema.md](docs/database-schema.md) | Skema data             |
| [docs/content-design.md](docs/content-design.md)   | Jenis mini-game & seed       |
| [docs/PRD-feature-feedback-confetti-math-bank.md](docs/PRD-feature-feedback-confetti-math-bank.md) | PRD penambahan: confetti + SFX salah & bank soal matematika Level 1–3 |

## Script berguna

```bash
pnpm build          # build frontend production (dist/)
pnpm check          # biome + tsc
pnpm db:migrate     # jika memakai migrate (opsional)
```

## Lisensi

Private — sesuaikan dengan kebutuhan Anda.
