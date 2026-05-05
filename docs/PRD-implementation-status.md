# Status implementasi vs dokumen `docs/`

Dokumen ini memetakan **apa yang sudah dibangun** di repo saat ini terhadap isi [PRD.md](PRD.md), [PRD-feature-feedback-confetti-math-bank.md](PRD-feature-feedback-confetti-math-bank.md), [PRD-feature-literasi-question-bank.md](PRD-feature-literasi-question-bank.md), [PRD-recommended-backlog-levels-4-10.md](PRD-recommended-backlog-levels-4-10.md), [PRD-feature-admin-panel.md](PRD-feature-admin-panel.md), dan [roadmap.md](roadmap.md).  
**Kode acuan**: struktur `apps/web/src/`, `apps/api/src/`, `prisma/` (perkiraan update: 2026-05-04).

Legenda: **Selesai** = perilaku inti ada di kode; **Sebagian** = dasar/placeholder/back-end saja; **Belum** = tidak ada atau hanya tercatat di dokumen.

---

## 1. PRD induk — [PRD.md](PRD.md) §5 MVP Scope

| Item PRD | Status | Catatan singkat |
| -------- | ------ | ---------------- |
| Mode TK & SD1 | Selesai | `ageMode` di profil + level seed per mode |
| Jalur Literasi & Matematika | Selesai | Rute `/track/literasi`, `/track/math` + seed |
| 12 level (3×2×2) + aktivitas | Selesai | Seed 12 `LevelDefinition` + aktivitas |
| 7 jenis mini-game | Selesai | `ActivityPlayer` + tipe `ActivityType` di Prisma |
| Multi-profil (max 4) | Selesai | Batas **per `ownerUserId` (parent)** atau **per cookie tamu `guestBindingId`** — [profiles-crud.ts](../apps/api/src/routes/web/profiles-crud.ts) + [child-access.ts](../apps/api/src/child-access.ts) |
| Bintang, XP, streak, stiker, badge | Sebagian | **Album stiker** `/p/:childId/stickers` + API `GET .../stickers`; XP quest **+15** & naik level konten **+50** di `submit-activity` |
| Audio / VO instruksi | Sebagian | **Instruksi teks** dibacakan lewat Web Speech API (`ActivityPlayer` + `voiceOverKeys.instruksi`); file MP3 di seed opsional |
| Parent area (PIN, progres, time cap, break) | Sebagian | PIN + laporan + **UI pengaturan** (batas harian, reminder istirahat, musik/SFX/motion) di `/parent` sesi aktif; perilaku anak lewat wellness overlay |
| Onboarding (bahasa, tutorial) | Sebagian | **`/`** = [HomeLanding](../apps/web/src/features/home/HomeLanding.tsx) (tamu default); **`/auth/sign-up`** & **`/auth/sign-in`**; **Tutorial 4 langkah** per profil; bahasa ID default; PIN area orang tua |
| Akun orang tua (email, Google) & progres cloud | Sebagian | `defaultRole: parent` + OAuth Google opsional env; `ChildProfile.ownerUserId`; **migrasi tamu → akun** & verifikasi email tegas belum |
| Wellness (istirahat, batas waktu) | Sebagian | **`PlayWellnessOverlay`** di halaman bermain: akumulasi waktu + modal istirahat + blok saat cap harian (`sessionStorage` per anak/hari) |
| Offline PWA | Sebagian | **`vite-plugin-pwa`**: manifest + service worker + precache build; dev tetap dua server |
| Settings: musik, SFX, volume, reminder, avatar | Sebagian | `ParentSettings` punya `musicEnabled`, `sfxEnabled`, dsb.; **UI sinkron** + **volume** + **kaitan SFX gameplay** sebagian memakai `localStorage` (`game-sfx-enabled`) di `useGameFeedback`, bukan hanya API |

---

## 2. PRD induk — mekanik & alur (ringkas)

| Aspek | Status | Catatan |
| ----- | ------ | ------- |
| Mastery & unlock level | Selesai | `mastery` service + level detail |
| Skor bintang 1–3 | Selesai | `submit-activity` + stars service |
| XP & aturan kumulatif | Sebagian | Tabel §7.2: aktivitas + **LEVEL_UP +50** + **DAILY_QUEST +15** (target harian = sampel 4 quest); selisih minor masih mungkin |
| Quest harian | Sebagian | UI `todayQuests` + bonus **+15** saat semua target harian (≤4 aktivitas) selesai (`daily-quest.ts`) |
| Alur main → hasil | Selesai | `PlayPage` + modal hasil |

---

## 3. Addendum — [PRD-feature-feedback-confetti-math-bank.md](PRD-feature-feedback-confetti-math-bank.md)

| Task / kriteria | Status | Catatan |
| ----------------- | ------ | ------- |
| **F1** Confetti jawaban benar | Selesai | `canvas-confetti` + `useGameFeedback` |
| **F1** SFX jawaban salah | Sebagian | Nada lembut via **Web Audio**, bukan file `wrong-soft.mp3` |
| **F1** `prefers-reduced-motion` | Selesai | Alternatif ring di `useGameFeedback` |
| **F1** Throttle SFX salah ~150 ms | Selesai | Di hook |
| **F1** Integrasi mini-game matematika | Selesai | `HitungBenda`, `Bandingkan`, `Penjumlahan`, `Pengurangan` |
| **F1** Integrasi literasi (opsional fase 2) | Selesai | Juga di `HurufGambar`, `SusunSukuKata`, `BacaKalimat` (melebihi teks PRD fase 2) |
| **F1** Toggle SFX dari pengaturan orang tua | Sebagian | `ParentSettings.sfxEnabled` di DB; **UI + sinkron ke** `useGameFeedback` / `localStorage` belum utuh |
| **F2** Bank soal ≥20 per level matematika (Opsi A) | Selesai | `prisma/math-banks.ts` + seed |
| **F2** Subset acak per sesi (5–8) | Selesai | `pickSessionQuestions` / `MATH_SESSION_QUESTION_COUNT` |
| **F2** Skrip validasi jumlah entri | Belum | Tidak ada tes otomatis di repo |
| **F2** UAT 2–3 anak | Belum | Kualitatif, bukan pekerjaan kode |
| Checklist §7: hook + math + seed | Selesai | (confetti + bank + integrasi) |
| Checklist §7: `wrong-soft.mp3` + design system | Belum | Diganti implementasi prosedural |
| Checklist §7: validator seed | Belum | |
| Checklist §7: UAT durasi sesi | Belum | |

---

## 4. Addendum — [PRD-feature-literasi-question-bank.md](PRD-feature-literasi-question-bank.md)

| Task / kriteria | Status | Catatan |
| ----------------- | ------ | ------- |
| Opsi A — ≥20 per level per mode (literasi) | Selesai | `prisma/literasi-banks.ts` + seed |
| Subset sesi | Selesai | Sama `pickSessionQuestions` di komponen literasi |
| Perluasan `emoji-map` | Selesai | Kunci baru (mis. `daun`, `perahu`, `pelangi`, …) |
| (Opsional) Tes jumlah entri | Belum | Bisa dijalankan manual lewat `tsx` (pernah dipakai saat dev) |
| UAT 2–3 anak | Belum | |
| Checklist §13 | Lihat file | Sudah diperbarui untuk item teknis utama; opsional & UAT masih terbuka |

---

## 4b. Addendum — [PRD-feature-admin-panel.md](PRD-feature-admin-panel.md)

> **Ringkasan:** **G0 ~selesai.** **G1–G3 sebagian besar jalan** (anak+audit UI, konten/bank+validasi server+import-export UI, analytics+settings termasuk **parent-settings / `isSuperParent`**). **G4 sebagian:** users admin, `/parent/super`, guard **`denyUnlessSuperParent`**, audit **SUPER_PARENT** + filter di UI. **Masih terbuka:** preview payload khusus di UI, grafik retensi §10, benchmark SLA, polish opsional. Detail: **§17** [PRD-feature-admin-panel.md](PRD-feature-admin-panel.md).

| Gelombang / Item | Status | Catatan |
| ----------------- | ------ | ------- |
| **G0** better-auth, mount `/api/auth/*`, bootstrap `pnpm admin:create`, signup publik **`parent`**, Google opsional | **Selesai (inti)** | [apps/api/src/auth.ts](../apps/api/src/auth.ts), `/admin/signup` = instruksi CLI; panel admin login terpisah. |
| **G1** RBAC, anak, audit | **Sebagian** | [apps/api/src/admin.ts](../apps/api/src/admin.ts), [apps/api/src/admin-middleware.ts](../apps/api/src/admin-middleware.ts), [apps/api/src/audit.ts](../apps/api/src/audit.ts), `recordSuperParentAudit`; [apps/web/src/router.tsx](../apps/web/src/router.tsx) termasuk **`/admin/children/$childId`**; [AdminAuditPage.tsx](../apps/web/src/features/admin/AdminAuditPage.tsx): kolom tipe actor; filter **`from`/`to`** (datetime lokal); **`super_admin`** juga filter `entityType` / **`actorType`**; tombol hapus filter. **Parsial:** PRD menyebut `requireSuperParent` — di kode [parent-super-guard.ts](../apps/api/src/parent-super-guard.ts) **`denyUnlessSuperParent`**. |
| **G2** Konten, bank, import/export | **Sebagian** | Editor konten/bank; [bank-validation.ts](../apps/api/src/bank-validation.ts); [AdminImportExportPage.tsx](../apps/web/src/features/admin/AdminImportExportPage.tsx). **Belum:** preview payload “kartu per item” di UI. |
| **G3** Analytics 5 metrik, settings | **Sebagian** | [apps/api/src/services/admin-analytics.ts](../apps/api/src/services/admin-analytics.ts); halaman `/admin/analytics`; [AdminSettingsPage.tsx](../apps/web/src/features/admin/AdminSettingsPage.tsx) (global + blok PIN **`isSuperParent`** untuk `super_admin`). **Belum:** grafik batang retensi seperti checklist §16 G3. |
| **G4** Users admin, super-parent | **Sebagian** | [AdminUsersPage.tsx](../apps/web/src/features/admin/AdminUsersPage.tsx); rute **`/parent/super`**; **`PATCH /api/admin/parent-settings`** + audit `PARENT_SUPER_FLAG_UPDATE`. **Belum:** ekspor CSV, 2FA, audit retensi cron. |
| Acceptance criteria §13 | **Parsial** | Lihat tabel §17 di PRD panel admin. |

---

## 5. [roadmap.md](roadmap.md) — fase & infrastruktur

| Area | Status | Catatan |
| ---- | ------ | ------- |
| Phase 0: tooling, Vite, Hono, Prisma, Biome | Selesai (inti) | TanStack Router + Hono; **TanStack Start** di roadmap terganti stack aktual |
| Vitest + Playwright | Sebagian | `pnpm test` (Vitest `apps/web/src/**/*.test.ts`), `pnpm test:e2e` (Playwright); **instal browser sekali:** `pnpm exec playwright install chromium` |
| Husky pre-commit | Belum | Tidak di `package.json` |
| GitHub Actions CI | Sebagian | Workflow `.github/workflows/ci.yml` — migrate, check, unit test, build, e2e |
| Phase 1–2: 7 game, profil, parent, streak, album | Sebagian | Game + profil + parent + backend reward/streak; **sticker album page**, **wellness UI**, **VO penuh** belum penuh |
| Phase 3: PWA, Workbox, Lighthouse, UAT formal | Sebagian / Belum | Build Vite ada; PWA/Lighthouse/UAT produksi belum |
| §10 Launch Ready checklist | Sebagian besar Belum / Sebagian | Banyak item legal/ops (privacy, backup, on-call) di luar cakupan kode saat ini |

---

## 6. Dokumen referensi lain (tanpa checklist rilis)

| Dokumen | Peran | Status vs repo |
| ------- | ----- | ---------------- |
| [architecture.md](architecture.md) | Arsitektur target | Patut disinkronkan dengan proxy Vite + server Hono aktual |
| [database-schema.md](database-schema.md) | Skema | Perbarui jika perlu: `ChildProfile.ownerUserId`, `guestBindingId` |
| [api-contracts.md](api-contracts.md) | API | Verifikasi spot-check disarankan |
| [content-design.md](content-design.md) | Payload mini-game | Payload seed mengikuti pola ini |
| [design-system.md](design-system.md) | UI/audio | Sebagian (warna/tema); audio/SFX file tidak lengkap |

---

## 7. Ringkasan satu halaman

**PRD v1.1 vs kode:** **akun bermain orang tua** (`role: parent`, email/Google opsional), **hingga 4 profil** per akun, **tamu** dengan penyekat cookie + **otorisasi** permainan per profil (**[child-access.ts](../apps/api/src/child-access.ts)**), halaman utama = beranda pemain (**[HomeLanding.tsx](../apps/web/src/features/home/HomeLanding.tsx)**) dengan banner daftar/masuk. **Belum diprioritaskan:** merge progres tamu ke akun, antrian offline jaringan.

**Sudah kuat di repo:** inti produk bermain (12 level, 7 tipe aktivitas), seed konten besar (**bank matematika + literasi**), API reward/mastery, dashboard & jalur level, area orang tua (PIN + laporan ringkas), **feedback confetti + suara** pada semua mini-game berbasis pilihan/susun.

**Masih gap utama vs PRD/roadmap:** file aset audio VO/MP3 produksi, validator seed otomatis, Husky/Deploy/CD formal, cakupan tes & skenario E2E lebih luas, dan aktivitas UAT/launch formal. **Sinkron pengaturan orang tua → feedback:** `GET /api/device/preferences` + `GameFeedbackSync` + `applyDevicePreferencesToGameFeedback` setelah simpan di `/parent`; `useGameFeedback` / VO mengikuti localStorage perangkat.

**Panel admin:** Auth + `/api/admin/*` + shell `/admin/*`; **lima metrik MVP**, analytics, editor konten/bank, validasi bank server-side, import/export, settings (global + flag super-orang tua), audit dengan jejak **SUPER_PARENT**, users admin (lihat **§17** [PRD-feature-admin-panel.md](PRD-feature-admin-panel.md)). Gap utama tersisa: preview payload di UI, grafik retensi §10, benchmark SLA, polish G4 opsional.

---

*Cara memelihara dokumen ini: setelah setiap rilis fitur, sesuaikan baris yang relevan atau tautkan ke PR/commit.*
