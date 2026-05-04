# Rekomendasi Fitur & Perbaikan Performa

> Lampiran terhadap [PRD-implementation-status.md](PRD-implementation-status.md) dan
> [roadmap.md](roadmap.md). Disusun berbasis pemeriksaan kode aktual di `src/` dan
> `server/` per Mei 2026.
>
> **Tingkat prioritas**:
>
> - **P0** — sebulan ini (perbaikan stabilitas & performa yang sudah teramati,
>   fondasi yang menahan pekerjaan lain).
> - **P1** — kuartal ini (fitur dengan dampak produk jelas, gap PRD G2–G4).
> - **P2** — kuartal berikutnya (post-MVP / pengembangan jangka panjang).

---

## 1. Ringkasan

| Kategori                        | P0  | P1  | P2  | Total |
| ------------------------------- | --- | --- | --- | ----- |
| Performa                        | 5   | 1   | 0   | 6     |
| Keamanan & reliability          | 4   | 1   | 1   | 6     |
| Fitur anak                      | 0   | 4   | 1   | 5     |
| Fitur orang tua                 | 0   | 3   | 1   | 4     |
| Fitur admin                     | 0   | 5   | 0   | 5     |
| PWA & aksesibilitas             | 1   | 3   | 0   | 4     |
| Konten                          | 0   | 3   | 1   | 4     |
| DX & testing                    | 2   | 2   | 0   | 4     |
| Arsitektur (monorepo)           | 0   | 0   | 1   | 1     |
| **Total**                       | 12  | 22  | 5   | 39    |

Catatan: P0 berfokus pada hal yang sudah berdampak ke pengguna sekarang
(lonjakan latency saat banyak level/profile, sesi orang tua hilang setelah
restart Fly, bundle awal besar). Sisanya merapikan PRD G2–G4 dan post-MVP.

---

## 2. Performa

### 2.1 (P0) Hilangkan N+1 di `GET /api/profiles/:id/levels`

[server/routes/web/gameplay.ts](../server/routes/web/gameplay.ts) baris 97–149
melakukan loop level dan untuk **setiap** level memanggil tiga query Prisma
(`levelMastery.findUnique`, `activityDefinition.findMany`, `progress.findMany`).
Saat 12 level (3×2×2) dan satu profil aktif, ini sudah 36 round-trip ke DB.
Ganti dengan satu kueri:

```ts
const levels = await prisma.levelDefinition.findMany({
  where: { ageMode: child.ageMode, ...(trackQ ? { track: trackQ } : {}) },
  include: {
    activities: { select: { id: true } },
    levelMastery: { where: { childId } },
  },
});
const progress = await prisma.progress.findMany({
  where: { childId, activity: { level: { ageMode: child.ageMode } } },
  select: { activityId: true, bestStars: true },
});
```

Lalu hitung `starsEarned`, `progressPct`, dsb. di memori — total dua query untuk
seluruh response.

### 2.2 (P0) Sama untuk `GET /api/parent/report/:childId` dan dashboard anak

[server/routes/web/parent-area.ts](../server/routes/web/parent-area.ts) loop
`tracks` dan untuk tiap track memanggil `count`, `findMany`, `progress.count`.
Dapat diringkas memakai `groupBy` + satu `findMany` aktivitas.
[server/services/dashboard.ts](../server/services/dashboard.ts) juga
memanggil beberapa query terpisah; cek peluang `Promise.all` atau gabungan.

### 2.3 (P0) Bungkus `submitActivity` dengan `prisma.$transaction`

[server/services/submit-activity.ts](../server/services/submit-activity.ts)
melakukan banyak `update`/`create` (progress, xpLog, streak, mastery, badge,
sticker) tanpa transaksi. Jika gagal di tengah, state anak bisa parsial
(mis. XP bertambah tapi mastery tidak tersinkron). Bungkus ke dalam interactive
transaction Prisma (`$transaction(async (tx) => { … })`) supaya atomic.

### 2.4 (P0) Code-splitting frontend

[src/router.tsx](../src/router.tsx) berukuran **1235 LoC** dan mengimpor seluruh
halaman admin (`AdminAnalyticsPage`, `AdminContentPage`,
`AdminBankEditorPage`, …) dan [ActivityPlayer](../src/features/ActivityPlayer.tsx)
(771 LoC) dalam satu bundle utama. Anak yang tidak pernah membuka `/admin` ikut
mengunduh ratusan KB JS. Pisahkan dengan `lazy()` TanStack Router atau
`React.lazy` + `Suspense`:

```ts
const AdminContentPage = lazy(() =>
  import('@/features/admin/AdminContentPage').then((m) => ({
    default: m.AdminContentPage,
  })),
);
```

Lakukan minimal untuk:

- Semua `Admin*Page` di [src/features/admin/](../src/features/admin/).
- `ActivityPlayer` (hanya dipakai di rute `/p/:childId/play/:activityId`).
- `OnboardingFlowPage` (hanya saat first-run per profil).

### 2.5 (P0) Tambah React Query / SWR untuk cache GET

Saat ini setiap halaman fetch ulang lewat `useEffect` tanpa cache (lihat
[src/features/home/HomeLanding.tsx](../src/features/home/HomeLanding.tsx),
`DashboardPage`, `AdminChildrenPage`, dst.). Tambah
`@tanstack/react-query` + `QueryClientProvider` di [src/main.tsx](../src/main.tsx),
lalu bungkus pemanggilan `api.getProfiles`, `api.getDashboard`,
`api.getLevels`, `api.getStickers` dengan `useQuery`. Manfaat:

- Stale-while-revalidate → klik balik tidak membuat layar berkedip.
- Invalidasi saat mutasi (mis. setelah `patchProfileSelf`).
- Built-in retry & dedup request paralel.

### 2.6 (P1) Indeks Prisma untuk kolom yang sering difilter

Cek [prisma/schema.prisma](../prisma/schema.prisma) dan tambahkan `@@index` jika
belum ada untuk:

- `Progress(childId, activityId)` (sudah lewat unique?).
- `XpLog(childId, createdAt)` untuk agregasi.
- `LevelMastery(childId, levelId)`.

Verifikasi dengan `EXPLAIN ANALYZE` di Postgres (Prisma Console).

---

## 3. Keamanan & reliability

### 3.1 (P0) Lindungi `PATCH /api/profiles/:id/self`

[server/routes/web/profiles-crud.ts](../server/routes/web/profiles-crud.ts)
mengekspos endpoint ubah profil tanpa autentikasi (untuk UX pemilih pemain di
beranda). Risiko: siapa pun yang mendapatkan id UUID dapat mengganti nama,
avatar, atau mode. Pilihan mitigasi (kombinasikan):

- Wajibkan PIN orang tua jika sudah diset (cek `parentSettings.pinHash`).
  Jika belum diset, izinkan (perangkat baru).
- Tambah rate-limit per IP (lihat §3.3).
- Audit log ringan ke `AuditLog` dengan `actorType = 'device'`.

### 3.2 (P0) Pindahkan parent session ke Prisma

[server/parent-session.ts](../server/parent-session.ts) menyimpan token di
`Map` in-memory dengan TTL 30 menit. Setiap restart Fly atau scale-out membuat
sesi orang tua hilang dan harus PIN ulang. Pindahkan ke model Prisma:

```prisma
model ParentSession {
  token     String   @id
  createdAt DateTime @default(now())
  expiresAt DateTime
  @@index([expiresAt])
}
```

Ganti `Map` dengan query `findUnique` + cleanup berkala (cron / job ringan saat
verify). Token tetap dikirim via header `X-Parent-Session`.

### 3.3 (P0) Rate limit endpoint sensitif

Belum ada middleware rate-limit di backend. Pasang
[`hono-rate-limiter`](https://hono.dev/middleware/builtin/rate-limit) atau
implementasi Redis-less berbasis Map+TTL untuk:

- `/api/auth/*` (sudah ada rate-limit Better Auth tapi mengembalikan 429
  tanpa context lokal).
- `POST /api/parent/verify-pin` & `setup-pin` & `change-pin`.
- `PATCH /api/profiles/:id/self` (lihat §3.1).

### 3.4 (P0) `app.onError` global

[server/app.ts](../server/app.ts) belum punya `app.onError`. Beberapa rute
admin memakai `schema.parse()` (Zod) yang dapat throw → respons 500 telanjang
tanpa pesan JSON. Tambahkan handler:

```ts
api.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: err.message } }, 400);
  }
  console.error('[api] unhandled', err);
  return c.json({ error: { code: 'INTERNAL', message: 'Terjadi kesalahan' } }, 500);
});
```

### 3.5 (P1) Konsolidasi role-check admin

Plugin Better Auth di [server/auth.ts](../server/auth.ts) punya matriks
`hasPermission`, tapi `/api/admin/*` memakai
[server/admin-middleware.ts](../server/admin-middleware.ts) sendiri. Sumber
kebenaran ganda. Pilih satu (disarankan plugin matrix) dan gunakan helper
tipis di middleware.

### 3.6 (P2) Audit log retensi & rotasi

`AuditLog` tumbuh tanpa retensi. Tambahkan job pembersihan (mis. retain
12 bulan) dan ekspor sebelum hapus.

---

## 4. Fitur anak

### 4.1 (P1) Adaptive difficulty

[PRD §6.2](roadmap.md) (Phase 4b) menyebut adaptive difficulty. Sederhana
untuk MVP+1: pakai rata-rata bintang **5 sesi terakhir** per anak per track
(dari [server/services/submit-activity.ts](../server/services/submit-activity.ts))
untuk menyesuaikan ukuran sampel bank di
[src/lib/math-session.ts](../src/lib/math-session.ts) (mis. 5–8 soal jadi
6–10 saat anak mahir).

### 4.2 (P1) Quest mingguan + papan tantangan

Saat ini hanya ada quest harian (lihat
[server/services/daily-quest.ts](../server/services/daily-quest.ts)). Tambah
quest mingguan (mis. "selesaikan 10 aktivitas" → bonus stiker langka) untuk
retensi D7 yang menjadi metrik MVP.

### 4.3 (P1) Mascot Lottie

Rute roadmap §5.1 dan §7.3 (cut line) menempatkan mascot Lottie sebagai
optional. Geser ke P1 karena ini menjadi sentuhan UX terkuat untuk audiens
anak. Komponen baru `<MascotLottie state="idle | celebrate | sleep" />`
dipakai di dashboard anak dan layar hasil di
[src/features/ActivityPlayer.tsx](../src/features/ActivityPlayer.tsx).

### 4.4 (P1) Ekspor album stiker (PNG / cetak)

[src/features/child/StickerAlbumPage.tsx](../src/features/child/StickerAlbumPage.tsx)
sudah menampilkan koleksi. Tambahkan tombol "Cetak album" untuk orang tua →
render `html2canvas` ke PNG/PDF. Bagus untuk reward fisik.

### 4.5 (P2) Tema mingguan & stiker spesial

[PRD §6.5](roadmap.md) Phase 4e — tema (Tata Surya, Kebun Binatang).
Memerlukan kerja konten besar; biarkan di P2.

---

## 5. Fitur orang tua

### 5.1 (P1) Insight area lemah/kuat di `/parent`

Saat ini laporan `/parent` hanya menampilkan total XP dan jumlah aktivitas
(lihat blok report di [src/router.tsx](../src/router.tsx) `ParentPage`).
Tambahkan diff `perTrack` (literasi vs math) plus rekomendasi 2–3 aktivitas
untuk dimainkan ulang berbasis bintang terendah. API sudah mengirim `perTrack`
di [server/routes/web/parent-area.ts](../server/routes/web/parent-area.ts).

### 5.2 (P1) Email weekly progress (opt-in)

PRD §6.6. Memerlukan `email` opsional di `ParentSettings`, kirim laporan via
provider (Resend/Postmark). Cron mingguan di Fly Machines.

### 5.3 (P1) PIN recovery dari pertanyaan pemulihan

Schema sudah menyimpan `pinSetupQuestion` & `pinSetupAnswerHash`
([server/routes/web/parent-area.ts](../server/routes/web/parent-area.ts)).
Belum ada endpoint `forgot-pin` yang memakai jawaban pemulihan untuk reset
PIN. Tambahkan flow `verify-recovery` → `change-pin` tanpa PIN lama.

### 5.4 (P2) Multi-device sync via QR pair

PRD §6.3. Memerlukan akun cloud orang tua dan migrasi `ChildProfile` ke
multi-tenant.

---

## 6. Fitur admin

### 6.1 (P1) Preview payload "kartu per item" di Bank Editor

PRD-feature-admin-panel.md G2 menyebut preview ini, dan
[PRD-implementation-status.md](PRD-implementation-status.md) menandai belum.
Render setiap item bank sebagai kartu mini dengan tampilan menyerupai mini-game
target di [src/features/admin/AdminBankEditorPage.tsx](../src/features/admin/AdminBankEditorPage.tsx).

### 6.2 (P1) Grafik retensi D1/D7 di `/admin/analytics`

PRD G3 §10 menyebut grafik batang. Saat ini
[src/features/admin/AdminAnalyticsPage.tsx](../src/features/admin/AdminAnalyticsPage.tsx)
hanya menampilkan angka. Tambah komponen chart ringan (Recharts atau
[Chart.js](https://www.chartjs.org)) untuk D1/D7, level completion, rata bintang
per aktivitas.

### 6.3 (P1) Ekspor CSV daftar anak & audit log

Sudah ada UI tapi belum tersedia ekspor CSV (PRD G4). Tambah endpoint
`GET /api/admin/export/children.csv` dan `GET /api/admin/export/audit.csv`
di [server/admin.ts](../server/admin.ts) yang stream `text/csv` (Hono
mendukung `c.body(stream)`).

### 6.4 (P1) 2FA TOTP untuk `super_admin`

Better Auth menyediakan plugin 2FA. Aktifkan untuk akun dengan role
`super_admin`. Konfigurasikan di [server/auth.ts](../server/auth.ts).

### 6.5 (P1) Halaman Activity preview (read-only)

QA konten saat ini tidak bisa memainkan aktivitas tanpa membuat profil anak.
Tambah rute `/admin/activities/:id/preview` yang render
[src/features/ActivityPlayer.tsx](../src/features/ActivityPlayer.tsx) dengan
mode "preview" (skor tidak dikirim, tidak menulis ke DB).

---

## 7. PWA & aksesibilitas

### 7.1 (P0) Install prompt + banner update SW

[vite.config.ts](../vite.config.ts) sudah memakai `vite-plugin-pwa` dengan
`registerType: 'autoUpdate'`, dan [src/main.tsx](../src/main.tsx) memanggil
`registerSW`. Belum ada UI yang memunculkan **install prompt**
(`beforeinstallprompt`) atau **banner pemberitahuan update SW**. Tambah
komponen `<InstallPrompt />` dan `<UpdatePrompt />` (workbox-window sudah
ada di dependencies).

### 7.2 (P1) Offline fallback halaman anak

Konfigurasi PWA saat ini `NetworkOnly` untuk `/api/*`. Tambahkan
`StaleWhileRevalidate` khusus untuk `GET /api/profiles/:id/dashboard` &
`GET /api/profiles/:id/stickers` agar anak tetap melihat data terakhir saat
offline. Update [vite.config.ts](../vite.config.ts) `runtimeCaching`.

### 7.3 (P1) Audit Lighthouse + a11y

Roadmap §5.3 menargetkan Performance ≥85, Accessibility ≥95, PWA ≥90.
Belum ada laporan Lighthouse di repo. Jalankan dan dokumentasikan baseline
+ daftar action item (kontras tombol, label form, focus-visible). Banyak
komponen sudah `aria-pressed` & `aria-label`, tapi modal di
[src/features/home/HomeLanding.tsx](../src/features/home/HomeLanding.tsx)
masih perlu focus trap.

### 7.4 (P1) Persist preferensi `prefers-reduced-motion`

Toggle "Kurangi animasi" di `/parent` sudah ada, tapi sinkronisasi ke
[src/lib/game-feedback-sync.ts](../src/lib/game-feedback-sync.ts) bergantung
pada `localStorage` per perangkat. Pastikan saat orang tua menyimpan
pengaturan, nilai langsung diaplikasikan ke
`useGameFeedback` tanpa reload.

---

## 8. Konten

### 8.1 (P1) Voice-over MP3 produksi

[PRD-feature-feedback-confetti-math-bank.md](PRD-feature-feedback-confetti-math-bank.md)
§7 menyebut `wrong-soft.mp3`. Saat ini SFX salah memakai Web Audio prosedural
([src/hooks/useGameFeedback.ts](../src/hooks/useGameFeedback.ts)). Lengkapi VO
instruksi dan completion line per aktivitas, taruh di `public/audio/`.

### 8.2 (P1) Validator seed otomatis

`prisma/math-banks.ts` & `prisma/literasi-banks.ts` punya banyak entri tapi
belum ada test/script yang menjamin minimal jumlah & format. Tambahkan:

- Script `scripts/bank-validate.ts` yang memvalidasi schema setiap bank.
- npm script `bank:validate` yang dipanggil di CI.

### 8.3 (P1) Level 4–7 untuk semua jalur

[docs/PRD-recommended-backlog-levels-4-10.md](PRD-recommended-backlog-levels-4-10.md)
sudah memetakan. Eksekusi konten level 4–7 (estimasi: ~1 minggu konten + 1
hari seed update).

### 8.4 (P2) Konten bilingual (Inggris)

PRD §6.4 Phase 4d. Memerlukan i18n setup (React-i18next) + VO Inggris.

---

## 9. DX & testing

### 9.1 (P0) Husky + lint-staged

Roadmap §2.1 task #7 mencatat Husky pre-commit, tapi
[package.json](../package.json) belum punya. Tambah `husky` + `lint-staged`
dengan hook `pre-commit` menjalankan `pnpm check` pada file ter-stage.

### 9.2 (P0) Test backend `server/services/*`

Tidak ada `*.test.ts` di `server/`. Mulai dari
[server/services/submit-activity.ts](../server/services/submit-activity.ts),
[server/services/mastery.ts](../server/services/mastery.ts), dan
[server/services/daily-quest.ts](../server/services/daily-quest.ts) yang
berisi logika reward inti. Pakai Vitest + Prisma test database
(SQLite memori atau Postgres docker).

### 9.3 (P1) E2E Playwright "happy path"

Saat ini hanya ada [e2e/home.spec.ts](../e2e/home.spec.ts) yang memeriksa
header. Tambah skenario:

- Buat profil → main 1 aktivitas → dapat bintang.
- Setup PIN orang tua → ubah PIN → verify PIN.
- Login admin → buka analytics.

### 9.4 (P1) Sentry / log shipping di Fly

Saat ini error backend hanya `console.error` ke stdout. Tambah Sentry SDK
(atau axiom/Better Stack) di [server/index.ts](../server/index.ts) untuk
trace error production tanpa scroll `fly logs`.

---

## 10. Saran roadmap 4 minggu

| Minggu | Fokus utama                                | Item            |
| ------ | ------------------------------------------ | --------------- |
| 1      | Stabilitas DB & query                      | §2.1, §2.2, §2.3, §3.4 |
| 2      | Bundle & cache frontend                    | §2.4, §2.5, §7.1 |
| 3      | Sesi orang tua tahan banting + rate limit  | §3.1, §3.2, §3.3, §9.2 |
| 4      | Konsolidasi UX admin + DX                  | §6.1, §6.2, §9.1, §9.3 |

Hasil akhir 4 minggu: latency `/api/profiles/:id/levels` turun signifikan,
TTI Netlify lebih cepat (admin tidak ikut bundle utama), sesi orang tua tidak
hilang setelah deploy Fly, panel admin punya preview konten + chart retensi,
dan pre-commit + e2e mencegah regresi rilis berikutnya.

---

## 11. Referensi cepat

| Path                                                                                       | Alasan disebut                                            |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [server/routes/web/gameplay.ts](../server/routes/web/gameplay.ts)                           | N+1 utama di endpoint `levels`, hotspot performa.         |
| [server/routes/web/parent-area.ts](../server/routes/web/parent-area.ts)                    | Loop `tracks` dengan banyak round-trip; PIN flow.         |
| [server/services/submit-activity.ts](../server/services/submit-activity.ts)                | Banyak mutasi tanpa transaksi; titik test prioritas.      |
| [server/services/admin-analytics.ts](../server/services/admin-analytics.ts)                | `progress.findMany` tanpa filter; cache TTL 5 menit.      |
| [server/parent-session.ts](../server/parent-session.ts)                                    | `Map` in-memory; perlu pindah ke Prisma.                  |
| [server/admin.ts](../server/admin.ts)                                                      | Sumber matriks role admin; titik untuk ekspor CSV.        |
| [server/routes/web/profiles-crud.ts](../server/routes/web/profiles-crud.ts)                | `PATCH /:id/self` tanpa auth.                             |
| [server/app.ts](../server/app.ts)                                                          | Tempat menambah `app.onError` & rate-limit middleware.    |
| [src/router.tsx](../src/router.tsx)                                                        | 1235 LoC, kandidat utama code-splitting.                  |
| [src/features/ActivityPlayer.tsx](../src/features/ActivityPlayer.tsx)                      | 771 LoC, hanya dibutuhkan saat anak bermain.              |
| [src/features/admin/](../src/features/admin/)                                              | Semua halaman admin, dapat di-`lazy` di router.           |
| [src/features/home/HomeLanding.tsx](../src/features/home/HomeLanding.tsx)                  | Modal edit profil, butuh focus trap.                      |
| [src/lib/game-feedback-sync.ts](../src/lib/game-feedback-sync.ts)                          | Persist preferensi perangkat, sambung ke `useGameFeedback`. |
| [vite.config.ts](../vite.config.ts)                                                        | Konfigurasi PWA & runtime caching.                        |
| [package.json](../package.json)                                                            | Tempat menambah Husky, lint-staged, react-query.          |
| [pnpm-workspace.yaml](../pnpm-workspace.yaml)                                              | Sudah ada tapi belum mendeklarasikan `packages:` — titik mulai monorepo. |

---

## 12. Transformasi ke pnpm monorepo (P2)

Saat ini repo adalah single-package: satu [package.json](../package.json),
satu [vite.config.ts](../vite.config.ts), satu [tsconfig.json](../tsconfig.json),
dengan `src/` (frontend Vite) + `server/` (Hono) di-deploy ke dua host
berbeda (Netlify untuk frontend, Fly untuk API). Ketika tim bertambah dan
permukaan admin tumbuh, struktur ini mulai berbenturan dengan §2.4 (bundle
admin ikut terunduh user anak/orang tua) dan §6 (panel admin perlu rilis
mandiri tanpa redeploy seluruh frontend).

### 12.1 Tujuan & manfaat

- **Pemisahan deployable** — bundle admin tidak lagi ikut diunduh user anak/
  orang tua (memperkuat §2.4 *code-split* — versi struktural).
- **Sharing tipe** — definisi Hono RPC bisa di-import frontend portal & admin
  via `packages/types` tanpa duplikasi.
- **SSR landing** — TanStack Start memberi streaming SSR → TTFB landing lebih
  cepat untuk SEO halaman orang tua dan onboarding.
- **Konfig terpusat** — preset Biome, `tsconfig.base.json`, dan Tailwind
  preset hidup di `packages/config`, dipakai semua app.

### 12.2 Struktur target

```
.
├── apps/
│   ├── api/            # eks. server/, hono ^4.7
│   ├── portal/         # TanStack Start + Router (landing, anak, orang tua)
│   └── admin/          # TanStack Start + Router (panel /admin)
├── packages/
│   ├── ui/             # komponen React + Tailwind (button, card, dialog focus-trap)
│   ├── config/         # tsconfig.base, biome preset, tailwind preset
│   ├── utils/          # lib helper (date, brand, age-mode, dll. dari src/lib/* shared)
│   └── types/          # PRD payload, hono RPC type, prisma re-export
├── prisma/             # tetap di root (single source of schema)
├── pnpm-workspace.yaml
├── package.json        # root, hanya devDeps & scripts pengelola workspace
└── turbo.json          # opsional, lihat 12.5
```

```mermaid
graph LR
  portal[apps/portal] --> ui[packages/ui]
  portal --> utils[packages/utils]
  portal --> types[packages/types]
  admin[apps/admin] --> ui
  admin --> utils
  admin --> types
  api[apps/api] --> utils
  api --> types
  api --> prisma[(prisma/schema)]
  types --> api
```

### 12.3 Pemetaan kode existing → folder baru

| Sumber sekarang                                                                  | Tujuan                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [server/](../server/) (kecuali `auth-proxy-headers.ts` netlify-spesifik)         | `apps/api/src/`                                                          |
| [src/router.tsx](../src/router.tsx) rute `/`, `/p/$childId/*`, `/parent`          | `apps/portal/src/routes/`                                                |
| [src/router.tsx](../src/router.tsx) rute `/admin/*` + [src/features/admin/](../src/features/admin/) | `apps/admin/src/routes/`                                       |
| `src/components/*` yang dipakai >1 app                                            | `packages/ui/src/`                                                       |
| [src/lib/brand.ts](../src/lib/brand.ts), `math-session.ts`, `game-feedback-sync.ts` | `packages/utils/src/`                                                  |
| [src/api.ts](../src/api.ts) (hono client)                                         | `packages/types/src/` (tipe + factory `createClient(baseUrl)`)           |
| [prisma/](../prisma/)                                                             | tetap di root, di-`export` lewat `packages/types`                         |

### 12.4 Tahap migrasi (incremental, 4 langkah)

1. **Hidupkan workspace** — tambah `packages: ['apps/*', 'packages/*']` ke
   [pnpm-workspace.yaml](../pnpm-workspace.yaml), tanpa memindahkan file. Repo
   tetap berjalan seperti biasa.
2. **Pisahkan API ke `apps/api/`** — pindah `server/` → `apps/api/src/`,
   salin script `start`/`dev:api` ke `apps/api/package.json`. Update
   [Dockerfile](../Dockerfile) supaya menjalankan `pnpm --filter api start`.
   Verifikasi Fly deploy tetap hijau, smoke test
   `GET /api/health` dan satu endpoint authenticated.
3. **Pisahkan frontend portal** — buat `apps/portal/` dengan TanStack Start
   (`pnpm create @tanstack/start`), pindah rute non-admin (landing, `/p/*`,
   `/parent`). Tetap konsumsi API via Netlify proxy (lihat
   [netlify.toml](../netlify.toml)). Pastikan admin bundle hilang dari network
   tab.
4. **Pisahkan admin** — buat `apps/admin/` di subdomain (mis.
   `admin.mainceria.app`) atau site Netlify terpisah. Pindah
   [src/features/admin/](../src/features/admin/) + rute. Inisialisasi Better
   Auth di app yang sama supaya cookie session admin tidak tercampur dengan
   session orang tua.

### 12.5 Konfigurasi penting

- `pnpm-workspace.yaml`:

  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```

- TS path alias dipindah ke `packages/config/tsconfig.base.json`, tiap app
  `extends`. Hilangkan `paths` `@/*` global di
  [tsconfig.json](../tsconfig.json); pakai `@portal/*`, `@admin/*` per-app
  dan import lintas-paket via nama paket (`@mainceria/ui`,
  `@mainceria/types`).
- (Opsional) [Turborepo](https://turborepo.com) untuk caching `pnpm check` dan
  build per-paket. Tidak wajib di P2 — `pnpm -r` sudah cukup untuk MVP.
- Better Auth `baseURL` per app: portal pakai
  `BETTER_AUTH_URL=https://mainceria.app`, admin pakai
  `https://admin.mainceria.app` — keduanya menunjuk ke `apps/api`.
  Set `cookies: { domain: '.mainceria.app' }` di [server/auth.ts](../server/auth.ts)
  agar SSO antar-subdomain.

### 12.6 Risiko & mitigasi

| Risiko                                                          | Mitigasi                                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| TanStack Start (Vinxi/Nitro) belum terbukti di prod kami         | Migrasi portal dulu sebagai pilot 2 minggu sebelum admin.                         |
| Type Hono RPC putus saat dipindah ke `packages/types`            | Buat script `pnpm --filter api build:types` yang emit `.d.ts` untuk frontend.     |
| Cookie Better Auth lintas subdomain                              | Set `cookies.domain = '.mainceria.app'` dan test di staging dengan dua subdomain. |
| CI/CD Fly + Netlify perlu update                                 | `pnpm install` di root, lalu `pnpm --filter api ...` / `--filter portal ...`.     |
| Prisma client bertambah lambat di-bootstrap di banyak app        | Letakkan generated client di `node_modules/.prisma/client` (default), re-export via `packages/types`. |
| Migrasi pertama berisiko regresi auth                            | Pertahankan endpoint `/api/auth/*` di host yang sama; jangan ubah `BETTER_AUTH_URL` sampai langkah 4 selesai. |

### 12.7 Kapan TIDAK melakukannya

- **Solo dev / 1 deployable.** Monorepo memberi value mulai 2+ kontributor
  yang menabrak file yang sama atau 2+ deployable yang ingin rilis terpisah.
- **Pondasi belum stabil.** Selesaikan §2 (performa) dan §3 (keamanan &
  reliability) lebih dulu — migrasi struktural di atas pondasi yang masih
  retak hanya menambah permukaan regresi.
- **Belum ada CI yang men-cover end-to-end.** Tanpa Playwright dasar (§9.3),
  bug saat memindah rute akan sulit terdeteksi.

### 12.8 Definition of done

- `pnpm install` sukses di root, semua `apps/*` dan `packages/*` terdeteksi
  oleh `pnpm -r list`.
- `pnpm --filter @mainceria/api dev` dan `pnpm --filter @mainceria/portal dev`
  jalan paralel via [scripts/dev.mjs](../scripts/dev.mjs) versi baru atau
  `pnpm -r --parallel dev`.
- Bundle admin tidak lagi muncul di network tab portal (verifikasi via
  Lighthouse / DevTools coverage).
- Fly deploy hijau (release_command `prisma migrate deploy` tetap dipanggil
  dari `apps/api`).
- Netlify menampilkan portal & admin di host masing-masing, tanpa shared JS.
- README utama diperbarui dengan diagram mermaid di §12.2 dan instruksi
  `pnpm --filter` paling umum.

---

*Cara memelihara dokumen ini: ketika satu rekomendasi diimplementasi, coret
nomornya dan rujuk PR. Ketika rekomendasi baru muncul dari retrospektif, sisipkan
sebagai sub-item baru di kategori yang sesuai.*
