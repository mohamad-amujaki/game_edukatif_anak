# PRD — Fitur: Feedback Confetti + SFX & Bank Soal Matematika

**Versi dokumen**: 1.0  
**Status**: Siap dikembangkan  
**Tanggal**: 2026-05-02  
**Produk induk**: [PRD.md](PRD.md) — Game Edukatif Anak (TK & SD kelas I)  
**Platform**: Web (PWA), konsisten dengan stack Vite + React + Hono + Prisma

---

## 1. Ringkasan eksekutif

Dokumen ini mendefinisikan **dua penambahan fitur** yang akan dikembangkan setelah MVP stabil:

| ID   | Fitur | Nilai bagi pengguna |
| ---- | ----- | ------------------- |
| **F1** | **Confetti** saat jawaban **benar** + **feedback suara** saat jawaban **salah** | Penguatan positif instan (benar) dan umpan balik jelas tanpa menyalahkan (salah), selaras prinsip PRD & design system. |
| **F2** | **Bank soal matematika** — minimal **20 kombinasi** pertanyaan–jawaban per **Level 1, 2, dan 3** (jalur Matematika) | Mengurangi pengulangan soal yang sama, meningkatkan variasi latihan, dan mendukung replay berulang tanpa bosan. |

**Prasyarat implementasi**: pengaturan audio (toggle SFX / musik) dan `reduceMotion` yang sudah di PRD induk harus dihormati untuk F1.

---

## 2. Fitur F1 — Confetti (benar) & suara (salah)

### 2.1 Tujuan

- Memberikan **celebrasi visual singkat** ketika anak memilih **jawaban benar** pada setiap langkah dalam aktivitas (bukan hanya di layar akhir aktivitas).
- Memberikan **umpan balik auditori** yang **ramah** ketika jawaban **salah**, tanpa narasi yang menyalahkan atau menakutkan.

### 2.2 Ruang lingkup (in-scope)

- Semua mini-game **interaktif berbasis pilihan** pada jalur yang sudah ada, minimal:
  - **Matematika**: `HITUNG_BENDA`, `BANDINGKAN_LEBIH_KURANG`, `PENJUMLAHAN_VISUAL`, `PENGURANGAN_VISUAL`
  - **Opsional fase 2 (literasi)**: `HURUF_GAMBAR_MATCHING`, `SUSUN_SUKU_KATA`, `BACA_KALIMAT_PENDEK` — dipetakan perilaku yang sama (benar/salah per aksi).

### 2.3 Perilaku produk

#### Confetti (jawaban benar)

| Aspek | Spesifikasi |
| ----- | ----------- |
| **Trigger** | Segera setelah sistem memvalidasi jawaban benar **untuk satu langkah/soal** (bukan hanya di akhir aktivitas). |
| **Durasi** | Total animasi **≤ 1,5 detik** (sesuai [design-system.md](design-system.md): hindari overstimulasi). |
| **Area** | Area gameplay atau tepat di atas kartu/tombol yang dikonfirmasi benar; boleh overlay fullscreen tipis **jika** opacity rendah agar tidak menutup seluruh layar terlalu lama. |
| **Teknis (disarankan)** | Library ringan (`canvas-confetti` satu burst) atau partikel CSS; hindari bundle besar. |
| **Aksesibilitas** | Jika `reduceMotion === true` (dari pengaturan orang tua / sistem): **ganti confetti** dengan **pulse ring / scale singkat** pada elemen benar + tetap mainkan SFX singkat (opsional volume lebih rendah). |

#### Suara (jawaban salah)

| Aspek | Spesifikasi |
| ----- | ----------- |
| **Trigger** | Segera setelah jawaban salah untuk satu langkah. |
| **Asset** | Satu file SFX tetap, misalnya **`apps/web/public/audio/wrong-soft.mp3`** atau `apps/web/public/audio/sfx/wrong-soft.mp3` sesuai konvensi [architecture.md](architecture.md) (URL `/audio/…`). |
| **Karakter suara** | Pendek (**≤ 500 ms**), nada **lembut** (bukan buzzer keras); konsisten dengan token `--color-error` yang “tidak menghukum”. |
| **Volume** | Mengikuti slider **SFX** di pengaturan; **duck** BGM jika sedang aktif (polarisasi dengan VO di PRD induk). |
| **Pengulangan** | Jika anak salah berkali-kali berturut-turut pada soal yang sama, boleh **throttle** main ulang SFX (mis. minimal jarak **150 ms**) untuk hindari iritasi — opsional, dokumentasikan di implementasi. |

### 2.4 Di luar lingkup (F1)

- Confetti di layar **hasil aktivitas** besar (itu sudah ada pola reward terpisah); F1 fokus **per langkah jawaban**.
- Voice-over kalimat panjang untuk salah (cukup SFX + visual tombol “gentle shake” opsional).

### 2.5 Kriteria penerimaan (acceptance criteria)

1. Pada tiap mini-game matematika berbasis pilihan, **setiap** jawaban benar menampilkan confetti (atau alternatif reduce-motion) dan memutar SFX benar yang sudah ada (`correct.mp3` atau setara).
2. Setiap jawaban salah memutar **satu** SFX salah yang konsisten; tidak ada teks “kamu bodoh” atau setara.
3. Toggle **SFX off** di pengaturan orang tua mematikan confetti **tidak** wajib dimatikan — hanya suara; namun jika produk memutuskan confetti ikut dimatikan saat “mode tenang”, cantumkan di changelog (opsional).
4. Lighthouse / tidak ada error konsol saat burst confetti berulang.

### 2.6 Implementasi teknis (garis besar)

- **Frontend**: hook `useFeedback()` atau wrapper pada handler jawaban di [`ActivityPlayer`](apps/web/src/features/ActivityPlayer.tsx) (dan komponen turunan).
- **State**: tidak mengubah skor server; hanya presentasi.
- **Tes**: minimal satu tes komponen atau E2E untuk “klik salah → audio dipanggil” (mock audio).

---

## 3. Fitur F2 — Bank soal matematika (Level 1–3)

### 3.1 Tujuan

Menyediakan **kumpulan variasi soal** yang cukup banyak untuk **Matematika Level 1, Level 2, dan Level 3** agar:

- Soal tidak selalu sama setiap sesi (idealnya **random** atau **rotasi** dari bank).
- Tetap selaras **rentang bilangan** dan **jenis aktivitas** per level (sesuai mode TK vs SD1).

### 3.2 Interpretasi kuota “minimal 20”

Permintaan bisnis: *“minimal 20 kombinasi pertanyaan dan jawaban untuk matematika pada level 1, level 2 dan level 3.”*

Agar implementasi terukur, dokumen ini mengunci interpretasi berikut (**disetujui sebagai target rilis fitur ini**):

| Level Matematika | Target minimum kombinasi **unik** (soal + jawaban yang bisa dibedakan) | Catatan |
| ---------------- | ------------------------------------------------------------------------ | ------- |
| Level 1          | **≥ 20**                                                                  | Per mode usia (**TK** dan **SD1** masing-masing punya level `*-math-1`). |
| Level 2          | **≥ 20**                                                                  | Idem untuk `*-math-2`. |
| Level 3          | **≥ 20**                                                                  | Idem untuk `*-math-3`. |

**Total minimum teoritis**: 20 × 3 level × 2 mode = **120** kombinasi unik di jalur matematika (TK + SD1), **jika** kedua mode tetap dipertahankan.

**Alternatif jika scope dikurangi** (harus diputuskan secara eksplisit oleh PM):

- **Opsi B**: Minimal **20 kombinasi total** yang **didistribusikan** ke Level 1–3 (mis. 7 + 7 + 6), per satu mode — dokumentasikan pembagian di seed.

> Rekomendasi produk: tetap pada **Opsi A (20 per level per mode)** untuk kualitas replay; Opsi B hanya untuk rilis cepat bertanda “beta konten”.

### 3.3 Pemetaan ke aktivitas & tipe mini-game

Level matematika saat ini (seed) mengikat satu aktivitas per level dengan payload JSON. Untuk F2:

| Level ID (contoh) | Jenis aktivitas utama | Cara mengisi 20+ variasi |
| ----------------- | --------------------- | ------------------------- |
| `tk-math-1`       | `HITUNG_BENDA`        | Array `questions[]` diperluas menjadi **≥ 20** objek unik (`jumlah`, `pilihan`, `jawaban`). |
| `tk-math-2`       | `HITUNG_BENDA`        | Idem. |
| `tk-math-3`       | `BANDINGKAN_LEBIH_KURANG` | **≥ 20** objek di `questions[]` dengan variasi pasangan (`kiri`/`kanan`). |
| `sd1-math-1`      | `PENJUMLAHAN_VISUAL`  | **≥ 20** kombinasi `(a,b)` unik dengan jawaban ≤ 20. |
| `sd1-math-2`      | `PENJUMLAHAN_VISUAL`  | Idem (rentang sesuai kurikulum level 2). |
| `sd1-math-3`      | `PENGURANGAN_VISUAL`  | **≥ 20** kombinasi `(a,b)` unik dengan `a−b` valid. |

Jika satu aktivitas tidak muat secara UX (sesi terlalu panjang), **pecah** menjadi:

- **Satu aktivitas** dengan `questions[]` panjang **atau**
- **Beberapa definisi aktivitas** dalam level yang sama (`order` 1, 2, …) dengan **total** kombinasi unik ≥ 20 — keduanya sah selagi penguncian mastery mengikuti aturan PRD induk.

### 3.4 Aturan pedagogis & kualitas konten

- **TK**: bilangan dan konteks sesuai Capaian Fase A (mis. 1–10 untuk hitung banding); hindari kebingungan angka yang terlalu rapat pada pilihan ganda berdampingan tanpa konteks visual.
- **SD1**: penjumlahan/pengurangan sesuai semester (hasil ≤ 20 untuk konsistensi dengan seed sekarang); variasi **bendaKey** / tema gambar untuk menghindari kebosanan visual.
- **Validasi**: setiap entri harus lolos schema Zod yang sama dengan [content-design.md](content-design.md); jawaban benar **tepat satu** di antara `pilihan` (untuk tipe pilihan ganda).

### 3.5 Randomisasi di runtime

- Saat memuat aktivitas, FE atau BE dapat mengirim **`questions` ter-shuffle** atau subset acak dengan panjang tetap per sesi (mis. **5 soal** diambil acak dari bank 20+) — keputusan ini mempengaruhi durasi sesi; dokumentasikan di implementasi.
- Minimum yang harus dipenuhi PR ini: **bank berisi ≥ 20 variasi**; tidak mewajibkan semua 20 ditampilkan dalam satu sesi.

### 3.6 Kriteria penerimaan (acceptance criteria)

1. Untuk **setiap** `LevelDefinition` matematika Level 1, 2, 3 pada **TK** dan **SD1**, payload seed memuat **≥ 20** entri soal valid sesuai tipe aktivitas (atau aktivitas berganda yang menjumlahkan ≥ 20 unik).
2. Tidak ada duplikat **persis** (pasangan soal identik dengan jawaban sama) dalam satu level kecuali disengaja untuk drill — jika ada duplikat, dokumentasikan alasan pedagogis.
3. Build & seed (`pnpm db:seed`) sukses; ukuran payload masih wajar untuk SQLite (< beberapa ratus KB teks).
4. Regresi: sistem mastery dan submit tetap memakai **satu** aktivitas per sesi atau pembagian attempts sesuai desain baru — tidak merusak API eksisting tanpa versi.

### 3.7 Risiko & mitigasi

| Risiko | Mitigasi |
| ------ | -------- |
| Sesi terlalu panjang jika 20 soal sekaligus | Ambil subset acak per sesi (mis. 5–8 soal). |
| Ukuran JSON besar | Kompres dengan menghapus field redundant; pertimbangkan normalisasi DB pada fase berikutnya. |
| QA konten salah | Skrip validasi seed yang menjalankan Zod + cek jawaban konsisten. |

---

## 4. Metrik sukses (fitur ini)

| Metrik | Target |
| ------ | ------ |
| Engagement | Rata-rata **≥ 3** putaran/sesi tambahan pada aktivitas matematika setelah deploy F2 (proxy: lebih banyak submit ulang). |
| Persepsi | UAT orang tua: **≥ 80%** menyatakan “anak tidak bosan soal sama” (survey opsional). |
| Teknis | Tidak ada peningkatan error rate > **0,1%** pada endpoint submit. |

---

## 5. Dependensi & dokumen terkait

- [PRD.md](PRD.md) — mastery, reward, wellness  
- [design-system.md](design-system.md) — audio, animasi, reduce motion  
- [content-design.md](content-design.md) — schema payload matematika  
- [database-schema.md](database-schema.md) — `ActivityDefinition.payload`  

---

## 6. Pertanyaan terbuka (untuk disepakati sebelum sprint)

1. **Konfirmasi kuota**: Opsi A (20 per level per mode) vs Opsi B (20 total tersebar)?  
2. **Confetti**: Untuk jawaban benar **berturut-turut** dalam satu aktivitas, confetti **setiap benar** atau **setiap N benar** untuk mengurangi fatigue visual?  
3. **Bahasa SFX salah**: apakah perlu tambahan VO satu kata (“coba lagi”) atau cukup SFX sesuai F1?

---

## 7. Lampiran — checklist implementasi engineer

- [ ] Hook feedback + integrasi di semua handler jawaban matematika  
- [ ] Asset `wrong-soft.mp3` + entri di design system  
- [ ] Perluasan seed `tk-math-1`, `tk-math-2`, `tk-math-3`, `sd1-math-1`, `sd1-math-2`, `sd1-math-3`  
- [ ] Validator seed / tes statis jumlah entri ≥ 20 per level  
- [ ] UAT singkat dengan 2–3 anak untuk durasi sesi setelah subset acak  
