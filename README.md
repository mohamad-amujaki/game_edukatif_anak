# Game Edukatif Anak

Game edukatif berbasis web untuk anak **TK (4–6 tahun)** dan **SD kelas I (7–8 tahun)** dengan fokus **literasi dasar** dan **matematika dasar** dalam Bahasa Indonesia.

## Menjalankan proyek (development)

Membutuhkan **dua proses**: API Hono (port 3000) dan Vite (port 5173). Proxy `/api` dari Vite mengarah ke API.

```bash
pnpm install
pnpm prisma db push          # pertama kali / setelah ubah schema
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
| Data      | Prisma + SQLite (`dev.db` di root proyek)    |
| Validasi  | Zod (server), kontrak di `docs/api-contracts.md` |

> Catatan: Dokumen PRD menyebut **TanStack Start**; implementasi saat ini memakai **Vite + TanStack Router + Hono** terpisah agar stabil dan mudah di-deploy. Perilaku produk mengikuti PRD di folder `docs/`.

## Dokumentasi produk

| Dokumen                                 | Isi                              |
| --------------------------------------- | -------------------------------- |
| [docs/PRD.md](docs/PRD.md)              | Requirement & alur pengguna      |
| [docs/architecture.md](docs/architecture.md) | Arsitektur target             |
| [docs/database-schema.md](docs/database-schema.md) | Skema data             |
| [docs/content-design.md](docs/content-design.md)   | Jenis mini-game & seed       |

## Script berguna

```bash
pnpm build          # build frontend production (dist/)
pnpm check          # biome + tsc
pnpm db:migrate     # jika memakai migrate (opsional)
```

## Lisensi

Private — sesuaikan dengan kebutuhan Anda.
