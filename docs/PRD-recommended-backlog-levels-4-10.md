# PRD — Backlog Disarankan & Ekspansi Level 4–10 (Literasi & Matematika)

**Versi dokumen**: 1.0  
**Status**: Draft produk — siap direview PM & kurikulum  
**Tanggal**: 2026-05-02  
**Produk induk**: [PRD.md](PRD.md) — Game Edukatif Anak  
**Acuan gap aktual**: [PRD-implementation-status.md](PRD-implementation-status.md)

---

## 1. Ringkasan eksekutif

Dokumen ini mendefinisikan **paket fitur yang belum/lumpuh dari MVP** namun **disarankan untuk dikembangkan** berikutnya, dan secara khusus mengunci **ekspansi jalur pembelajaran dari 3 level menjadi 10 level** pada **Literasi** dan **Matematika**, untuk **kedua mode usia** (**TK** dan **SD1**).

**Ringkasan kuantitatif ekspansi level**

| Konfigurasi | Level saat MVP | Target |
| ----------- | -------------- | ------ |
| Per jalur × per mode | 3 level (`order` 1–3) | **10 level** (`order` 1–10) |
| Penambahan per jalur × mode | — | **+7 level** |
| Total `LevelDefinition` baru (4 kombinasi jalur×mode) | — | **28 level baru** |

Catatan: MVP saat ini memiliki **12 level** (3×2×2). Setelah rilis fitur ini (penuh): **40 level** (10×2×2), asumsinya **satu aktivitas utama per level** tetap seperti pola sekarang kecuali ditentukan lain.

---

## 2. Tujuan bisnis & pengguna

| Pemangku kepentingan | Manfaat |
| -------------------- | ------- |
| Anak | Rentang tantangan lebih panjang; kurang cepat “habis” konten; progresi jelas sampai level 10. |
| Orang tua | Perasaan “ada isi” untuk dipakai berminggu-minggu; laporan progres bisa lebih bermakna. |
| Produk | Menaikkan retensi (D7/D30), jam bermain bermakna, dan diferensiasi vs MVP tipis. |

---

## 3. Ruang lingkup & luar lingkup

### 3.1 In-scope (rilis yang ditargetkan dokumen ini)

**A. Ekspansi konten Level 4–10**

- Menambah **28 definisi level** (`tk-literasi-4` … `tk-literasi-10`, `tk-math-4` … `tk-math-10`, `sd1-literasi-4` … `sd1-literasi-10`, `sd1-math-4` … `sd1-math-10`).
- Setiap level: minimal **satu** `ActivityDefinition` dengan payload valid (reuse **7 tipe** mini-game yang ada).
- **Bank soal / pasangan** mengikuti standar addendum: **minimal 20 kombinasi unik per level** per mode (sama seperti PRD bank matematika & literasi), dengan **subset acak per sesi** di klien.
- **Capaian pembelajaran** per level dijelaskan ringkas di seed atau dokumen konten (agar QA kurikulum bisa meninjau).

**B. Backlog produk/teknis yang disarankan** (dipelopori bersamaan atau dalam gelombang — prioritas §8)

- Pelengkapan **PWA offline** (manifest + caching strategis).
- **Wellness UI**: modal istirahat & enforcement **daily time cap** sesuai PRD induk.
- **Parent settings UI**: sinkron dengan `ParentSettings` (musik, SFX, volume, reminder, `reduceMotion`).
- **Album stiker** (halaman atau sheet) + akses dari dashboard anak.
- **Voice-over** instruksi aktivitas terpasang di alur bermain (minimal pemutaran berkas dari `voiceOverKeys`).
- **Aset audio final**: mis. `wrong-soft.mp3` / **sinkron** `sfxEnabled` dari orang tua dengan hook feedback (mengganti/semelengkapi Web Audio).
- **Pengujian otomatis** (Vitest untuk motor reward/mastery; minimal satu E2E Playwright untuk loop bermain).
- **Validator seed** (skrip memastikan ≥20 entri per level konten & ID level unik).

### 3.2 Di luar lingkup (dokumen ini)

- **Bahasa Inggris / bilingual** (tetap Phase 4+ di PRD induk).
- **Sinkron cloud / akun orang tua** email-password.
- **Jenis mini-game ke-8+** (mis. pengurutan bilangan baru) — boleh masuk PRD terpisah; ekspansi level **dimulai** dengan reuse tipe yang ada.
- **Personalisasi adaptif / ML**.
- **Monetisasi**.

---

## 4. Prinsip desain ekspansi level

1. **Reuse dulu**: Level 4–10 utama memakai kombinasi `ActivityType` yang sudah ada agar risiko engineering rendah.
2. **Progresi pedagogis**: tiap level punya judul + deskripsi yang mencerminkan naiknya kesulitan (lihat §6).
3. **Mastery konsisten**: aturan unlock **≥2 bintang di semua aktivitas level N** tetap berlaku ([PRD.md](PRD.md) §6).
4. **Konten terukur**: bank ≥20 per level (Opsi A) untuk matematika & literasi mengikuti [PRD-feature-feedback-confetti-math-bank.md](PRD-feature-feedback-confetti-math-bank.md) & [PRD-feature-literasi-question-bank.md](PRD-feature-literasi-question-bank.md).
5. **ID stabil**: gunakan konvensi ID mis. `{ageMode slug}-literasi-{order}`, `{ageMode slug}-math-{order}` agar migrasi seed aman.

---

## 5. Pemetaan teknis (implementasi)

| Lapisan | Perubahan |
| ------- | ---------- |
| **Prisma / seed** | Tambah 28 `LevelDefinition` + `ActivityDefinition` + generator bank di `math-banks` / `literasi-banks` (atau modul baru per rentang level). |
| **Enum** | `ActivityType` **tidak** wajib diubah pada rilis reuse-only. |
| **API** | Tidak perlu versi baru jika skema response level sudah generik; verifikasi `getLevels` mengembalikan 10 level per jalur. |
| **FE** | `TrackPage` harus menampilkan **10 level** (scroll / pagination kecil jika perlu); pastikan urutan `order` konsisten. |
| **Badge / achievement** | Pertimbangkan badge “Master Literasi 10” dll. (PRD terpisah mini atau tambahan kriteria di `badgeCatalog`). |

---

## 6. Arah kurikulum per level (disarankan — perlu validasi tim konten)

Tabel berikut adalah **arah** capaian; daftar pasti aktivitas & rentang bilangan ditetapkan saat penulisan seed.

### 6.1 TK — Literasi (Level 4–10)

| Level | Arah capaian (contoh) | Tipe yang disarankan |
| ----- | --------------------- | --------------------- |
| 4 | Huruf kapital lanjut + kosakata tema binatang | `HURUF_GAMBAR_MATCHING`, `SUSUN_SUKU_KATA` |
| 5 | Suku kata tertutup sederhana / gabungan huruf | `SUSUN_SUKU_KATA` |
| 6 | Kata 2–3 suku tema sekolah | `SUSUN_SUKU_KATA` |
| 7 | Pemahaman kata dalam konteks pendek | `BACA_KALIMAT_PENDEK` (kalimat sangat pendek) |
| 8 | Variasi distraktor suku kata | `SUSUN_SUKU_KATA` |
| 9 | Review campuran huruf + susun | Matching + susun |
| 10 | Mini-ulasan jalur TK literasi | Campuran terkontrol |

### 6.2 TK — Matematika (Level 4–10)

| Level | Arah capaian (contoh) | Tipe yang disarankan |
| ----- | --------------------- | --------------------- |
| 4 | Bilangan & pola 11–15 | `HITUNG_BENDA` |
| 5 | Bandingkan jumlah pada rentang lebih luas | `BANDINGKAN_LEBIH_KURANG` |
| 6 | Penjumlahan cerita sederhana (≤10) | `PENJUMLAHAN_VISUAL` |
| 7 | Pengurangan visual (≤10) | `PENGURANGAN_VISUAL` |
| 8 | Campuran tambah/kurang kontekstual | Penjumlahan / pengurangan bergantian |
| 9 | Pola & urutan bilangan (tanpa tipe baru: pakai visual penjumlahan/hitung) | Sesuai payload |
| 10 | Ulangan kompetensi TK matematika | Campuran |

### 6.3 SD1 — Literasi (Level 4–10)

| Level | Arah capaian (contoh) | Tipe yang disarankan |
| ----- | --------------------- | --------------------- |
| 4 | Kata lebih panjang / frasa | `SUSUN_SUKU_KATA` |
| 5 | Kalimat 3–5 kata, distraktor lebih halus | `BACA_KALIMAT_PENDEK` |
| 6 | Perspektif membaca singkat | `BACA_KALIMAT_PENDEK` |
| 7 | Latihan suku kata kompleks | `SUSUN_SUKU_KATA` |
| 8 | Pemahaman teks sangat pendek | `BACA_KALIMAT_PENDEK` |
| 9 | Gabungan susun + baca | Dua aktivitas dalam level **atau** satu aktivitas dengan bank besar |
| 10 | Ulangan jalur literasi SD1 | Campuran |

### 6.4 SD1 — Matematika (Level 4–10)

| Level | Arah capaian (contoh) | Tipe yang disarankan |
| ----- | --------------------- | --------------------- |
| 4 | Penjumlahan mendekati 20 / bentuk cerita | `PENJUMLAHAN_VISUAL` |
| 5 | Pengurangan hingga 20 | `PENGURANGAN_VISUAL` |
| 6 | Hitung benda / bandingkan dalam konteks SD | `HITUNG_BENDA` / `BANDINGKAN_LEBIH_KURANG` |
| 7 | Operasi campuran sederhana (bergantian sesi) | Penjumlahan & pengurangan |
| 8 | Bilangan mendekati 100 (representasi visual sederhana) | Sesuai desain payload |
| 9 | Masalah verbal pendek | Penjumlahan/pengurangan |
| 10 | Ulangan kompetensi SD1 matematika | Campuran |

> **Catatan**: Rentang bilangan dan kompleksitas harus selaras **Kurikulum Merdeka** Fase Fondasi / kelas I; penyesuaian final oleh ahli konten.

---

## 7. Kriteria penerimaan (acceptance)

### 7.1 Ekspansi level

1. Untuk setiap kombinasi `(track, ageMode)` dengan `order` 1–10, UI menampilkan **10 level** dan aturan **unlock** berjalan tanpa error.
2. Setiap level baru memiliki **payload aktivitas valid** dan dapat diselesaikan hingga layar hasil.
3. Minimal **20 kombinasi unik** per level untuk aktivitas berbasis bank (matematika & literasi) sesuai standar addendum.
4. `pnpm db:seed` sukses; tidak ada duplikasi ID level/aktivitas.

### 7.2 Backlog pelengkap MVP (jika dimasukkan sprint yang sama)

5. PWA: aplikasi dapat di-*install* dan membuka shell utama tanpa jaringan setelah kunjungan pertama (ruang lingkup caching konten dapat bertahap).
6. Parent settings tercermin di perilaku anak (SFX/musik/reminder sesuai PRD).
7. Minimal satu tes otomatis kritis (reward atau mastery) hijau di CI.

---

## 8. Prioritisasi gelombang (disarankan)

| Gelombang | Isi | Estimasi kasar |
| --------- | --- | -------------- |
| **G1** | Level 4–6 keempat jalur + bank soal + validator seed | 3–4 sprint |
| **G2** | Level 7–8 + album stiker + VO minimal | 2–3 sprint |
| **G3** | Level 9–10 + wellness UI + parent settings UI lengkap | 2–3 sprint |
| **G4** | PWA penuh + E2E + hardening | 2 sprint |

Estimasi dapat dipadatkan dengan tim paralel (konten vs engineering).

---

## 9. Risiko & mitigasi

| Risiko | Mitigasi |
| ------ | -------- |
| Ledakan volume konten (28 level × ≥20 soal) | Generator modul seed; review konten bertahap per gelombang. |
| Kemajuan terlalu curam untuk TK | Uji playtest per level; turunkan kesulitan berdasarkan UAT. |
| Performa JSON besar | Subset sesi (sudah ada); pertimbangkan normalisasi DB di fase berikutnya. |
| Scope creep mini-game baru | Kunci rilis reuse-only; mini-game baru PRD terpisah. |

---

## 10. Metrik sukses

| Metrik | Target |
| ------ | ------ |
| Retensi D7 | Naik vs baseline MVP (ukur sebelum/ sesudah). |
| Completion rate per level 4+ | ≥40% anak yang mencapai level 4 dalam 14 hari (proxy engagement). |
| Teknis | Tidak ada peningkatan crash/error submit > 0,1%. |

---

## 11. Pertanyaan terbuka

1. Apakah **beberapa level** memerlukan **lebih dari satu aktivitas** per level (mis. susun + baca) — mempengaruhi mastery “semua aktivitas level N”?  
2. Untuk level 9–10, apakah **wajib** satu aktivitas “ujian ringkas” terpisah atau cukup bank lebih sulit?  
3. Apakah **bracket usia** tetap hanya TK vs SD1, atau perlu **label tingkat** tambahan di dalam mode?

---

## 12. Lampiran — checklist engineer (tingkat tinggi)

- [ ] Skema ID & migrasi seed untuk 28 level + aktivitas  
- [ ] Perluasan `math-banks` / `literasi-banks` (atau paket per rentang)  
- [ ] Verifikasi `getLevels` / UI track untuk 10 level  
- [ ] Update ikon/judul level pada `LevelDefinition`  
- [ ] (Opsional) Badge baru untuk menyelesaikan level 10 per jalur  
- [ ] Dokumentasi capaian per level untuk tim konten (`content-design.md` atau sheet internal)  

---

## 13. Dependensi dokumen

- [PRD.md](PRD.md)  
- [PRD-implementation-status.md](PRD-implementation-status.md)  
- [content-design.md](content-design.md)  
- [roadmap.md](roadmap.md) — Phase 4a konten  

---

*Dokumen ini menggantikan implisit “Level 4–10 akan ditambah” di §5.2 PRD induk dengan spesifikasi yang dapat dieksekusi dan diprioritaskan.*
