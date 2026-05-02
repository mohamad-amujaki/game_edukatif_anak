# PRD — Fitur: Bank Soal Literasi (Level 1–3)

**Versi dokumen**: 1.0  
**Status**: Siap dikembangkan  
**Tanggal**: 2026-05-02  
**Produk induk**: [PRD.md](PRD.md) — Game Edukatif Anak (TK & SD kelas I)  
**Platform**: Web (PWA), konsisten dengan stack Vite + React + Hono + Prisma  
**Relasi**: pola paralel dengan bank soal matematika — lihat [PRD-feature-feedback-confetti-math-bank.md](PRD-feature-feedback-confetti-math-bank.md) §3 (interpretasi kuota & randomisasi).

---

## 1. Ringkasan eksekutif

| ID | Fitur | Nilai bagi pengguna |
| -- | ----- | ------------------- |
| **LQ** | **Bank soal literasi** — minimal **20 kombinasi** pertanyaan–jawaban per **Level 1, 2, dan 3** pada jalur **Literasi** | Mengurangi pengulangan soal yang sama, meningkatkan variasi latihan huruf/suku kata/kalimat pendek, dan mendukung pengulangan bermain tanpa bosan. |

**Catatan**: Integrasi **confetti / SFX per langkah** untuk mini-game literasi berbasis pilihan dapat mengikuti pola hook yang sama seperti matematika (lihat PRD fitur confetti); dokumen **ini** berfokus pada **kuantitas dan kualitas konten**, bukan pada efek visual/audio.

---

## 2. Masalah & latar belakang

Pada seed MVP, beberapa level literasi hanya memuat **beberapa** pasangan soal (`pairs` atau `questions`). Untuk replay bermakna dan variasi pedagogis, dibutuhkan **minimal 20 kombinasi unik** per level literasi (sesuai permintaan produk), dengan definisi “kombinasi” yang konsisten per tipe aktivitas (§4).

---

## 3. Tujuan & luar lingkup

### 3.1 Tujuan

- Setiap **LevelDefinition** literasi Level **1, 2, dan 3** pada mode **TK** dan **SD1** menyimpan payload dengan **≥ 20** entri soal yang dapat dibedakan (§4).
- Konten tetap selaras **capaian jalur literasi** di PRD induk (huruf & suku kata TK; pembacaan kata/kalimat pendek SD1).
- Mendukung **randomisasi sesi** (subset dari bank) agar satu sesi tidak memuat 20 soal sekaligus kecuali disengaja (§6).

### 3.2 Di luar lingkup (rilis fitur ini)

- Mengubah **tipe** aktivitas per level (tetap mengikuti mapping seed sekarang kecuali diputuskan refactor terpisah).
- Rekaman audio penuh untuk setiap kalimat (`audioKey` boleh tetap placeholder sampai fase VO).
- CMS authoring oleh orang tua; konten tetap lewat **seed / definisi aktivitas** di repo.

---

## 4. Interpretasi “minimal 20 kombinasi pertanyaan dan jawaban”

### 4.1 Opsi kuota (harus dipilih sebelum implementasi)

Permintaan bisnis: *minimal 20 kombinasi pertanyaan dan jawaban untuk literasi pada level 1, level 2 dan level 3.*

| Opsi | Deskripsi | Total minimum unik (TK + SD1, 3 level masing-masing) |
| ---- | --------- | ----------------------------------------------------- |
| **A (disarankan)** | **≥ 20** kombinasi unik **per level** **per mode usia** (`tk-literasi-*` dan `sd1-literasi-*` masing-masing) | **20 × 3 × 2 = 120** |
| **B (rilis cepat)** | **≥ 20** kombinasi **total** yang **didistribusikan** ke Level 1–3 untuk satu mode — pembagian harus tertulis di seed (mis. 7 + 7 + 6) | **20 per mode** |

**Rekomendasi produk**: **Opsi A**, konsisten dengan bank soal matematika dan ekspektasi replay.

### 4.2 Definisi satu “kombinasi” per tipe mini-game

Kombinasi dihitung **per entri** yang menjadi satu unit bermain yang dapat diskor / dihitung salah:

| Tipe aktivitas | Field payload | Satu kombinasi = |
| -------------- | ------------- | ---------------- |
| `HURUF_GAMBAR_MATCHING` | `pairs[]` | Satu objek `{ huruf, gambarKey, gambarLabel }` — satu pasangan huruf–gambar yang harus dicocokkan. |
| `SUSUN_SUKU_KATA` | `questions[]` | Satu objek soal lengkap (`gambarKey`, `targetKata`, `sukuKataKepingan`, dll.) — satu target kata yang disusun dari kepingan. |
| `BACA_KALIMAT_PENDEK` | `questions[]` | Satu objek (`kalimat`, `gambarBenar`, `gambarSalah`, …) — satu kalimat dengan satu jawaban gambar benar. |

Duplikat **persis** (isi identik termasuk jawaban) dalam satu level harus dihindari kecuali untuk drill disengaja — jika ada, dokumentasikan di komentar seed.

---

## 5. Pemetaan level → aktivitas & konten (seed saat ini)

Target implementasi: memperluas array yang relevan hingga **≥ 20** entri per baris berikut.

| Level ID | Mode | Jenis aktivitas (seed) | Cara mencapai ≥ 20 |
| -------- | ---- | ---------------------- | ------------------- |
| `tk-literasi-1` | TK | `HURUF_GAMBAR_MATCHING` | Perluas **`pairs`** menjadi ≥ 20 pasangan unik (huruf kapital + gambar dari kamus emoji — lihat [content-design.md](content-design.md) / `emoji-map`). |
| `tk-literasi-2` | TK | `SUSUN_SUKU_KATA` | Perluas **`questions`** menjadi ≥ 20 soal susun suku kata (tema sesuai judul level). |
| `tk-literasi-3` | TK | `SUSUN_SUKU_KATA` | Idem. |
| `sd1-literasi-1` | SD1 | `SUSUN_SUKU_KATA` | ≥ 20 soal (kata dua suku / sesuai judul level). |
| `sd1-literasi-2` | SD1 | `SUSUN_SUKU_KATA` | ≥ 20 soal (kata lebih panjang / variasi keping pengganggu). |
| `sd1-literasi-3` | SD1 | `BACA_KALIMAT_PENDEK` | Perluas **`questions`** menjadi ≥ 20 kalimat + set gambar benar/salah. |

Jika satu JSON aktivitas menjadi terlalu besar untuk kenyamanan maintainer, **diperbolehkan** memecah menjadi **beberapa `ActivityDefinition`** dalam level yang sama (`order` 1, 2, …) dengan **jumlah kombinasi unik gabungan ≥ 20** — mastery dan navigasi mengikuti aturan PRD induk dan tidak merusak API tanpa versi.

---

## 6. Randomisasi di runtime (disarankan)

- Samakan pola dengan matematika: dari bank ≥ 20, **ambil subset acak** per sesi (mis. **5–8** soal / pasangan) di [`ActivityPlayer`](src/features/ActivityPlayer.tsx) atau lapisan pembungkus payload.
- Minimum yang wajib dari PR ini: **bank berisi ≥ 20 variasi**; tidak mewajibkan menampilkan semua dalam satu sesi.

---

## 7. Aturan pedagogis & kualitas konten

- **TK**: huruf kapital, suku kata terbuka sederhana, kosakata dekat anak (buah, binatang, rumah); hindari huruf yang membingungkan berulang dalam satu sesi **kecuali** sebagai distraktor terkontrol di `SUSUN_SUKU_KATA`.
- **SD1**: suku kata lebih kompleks, kata lebih panjang, kalimat pendek **2–5 kata** untuk `BACA_KALIMAT_PENDEK`; **gambarSalah** harus masuk akal sebagai distraktor (bukan sekadar random).
- **Validasi teknis**: setiap entri lolos schema yang dipakai aplikasi (Zod / [content-design.md](content-design.md)); setiap **`gambarKey`** yang dipakai UI ada di peta emoji atau ditambahkan di seed bersama entri `ILLUSTRATION_EMOJI`.
- **Bahasa**: Indonesia standar anak; hindari kata kasar, jargon dewasa, atau kalimat ambigu.

---

## 8. Kriteria penerimaan (acceptance criteria)

1. Untuk **setiap** level literasi Level 1, 2, dan 3 pada **TK** dan **SD1**, total kombinasi unik sesuai §4.2 **≥ 20** (Opsi A) atau sesuai pembagian yang disepakati (Opsi B).
2. `pnpm db:seed` sukses; payload tidak merusak parsing JSON di `ActivityDefinition`.
3. Tidak ada regresi: alur bermain, skor, dan mastery tetap konsisten dengan desain MVP.
4. (Opsional) Skrip atau tes statis yang mengassert jumlah entri ≥ 20 per level sesuai Opsi A.

---

## 9. Risiko & mitigasi

| Risiko | Mitigasi |
| ------ | -------- |
| Sesi terlalu panjang jika 20 item dimainkan sekaligus | Subset acak per sesi (§6). |
| Ukuran JSON besar | Generator/modul seed terpisah (mirip `prisma/math-banks.ts`); hindari duplikasi manual berlebihan. |
| Keping `SUSUN_SUKU_KATA` tidak valid | Generator memastikan huruf keping cocok dengan `targetKata`; QA manual sampel. |
| Kalimat `BACA_KALIMAT_PENDEK` tidak selaras gambar | Review konten; minimal satu reviewer selain author seed. |

---

## 10. Metrik sukses (fitur ini)

| Metrik | Target |
| ------ | ------ |
| Engagement | Peningkaman **retry** atau sesi berulang pada level literasi (proxy: submit / completion tanpa keluar cepat). |
| Teknis | Tidak ada kenaikan error parse payload atau error submit > **0,1%** pasca-deploy. |

---

## 11. Dependensi & dokumen terkait

- [PRD.md](PRD.md) — jalur literasi & persona  
- [content-design.md](content-design.md) — struktur payload literasi  
- [database-schema.md](database-schema.md) — `ActivityDefinition.payload`  
- [PRD-feature-feedback-confetti-math-bank.md](PRD-feature-feedback-confetti-math-bank.md) — pola bank soal & subset sesi (referensi silang)

---

## 12. Pertanyaan terbuka (untuk PM / konten)

1. Konfirmasi **Opsi A vs B** untuk kuota (§4.1).  
2. Apakah **huruf kecil** perlu dimasukkan untuk TK Level 1 pada iterasi ini, atau tetap **huruf kapital** saja?  
3. Untuk `BACA_KALIMAT_PENDEK`, apakah **VO** wajib per kalimat pada rilis yang sama, atau boleh placeholder sampai fase audio?

---

## 13. Lampiran — checklist implementasi engineer

- [ ] Sepakati Opsi A atau B dan dokumentasikan di changelog seed  
- [ ] Modul generator / perluasan seed untuk `tk-literasi-1` … `sd1-literasi-3`  
- [ ] Perluasan `emoji-map` / kunci gambar jika ada benda baru  
- [ ] `pickSessionQuestions` (atau setara) untuk komponen literasi yang memakai bank panjang  
- [ ] (Opsional) Tes atau skrip validasi jumlah entri ≥ 20 per level  
- [ ] UAT singkat 2–3 anak: durasi sesi dan kejelasan instruksi  
