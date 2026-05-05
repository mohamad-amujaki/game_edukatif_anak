# Content Design — Game Edukatif Anak

Dokumen ini mendefinisikan **bentuk konkret** dari aktivitas yang dimainkan anak: 7 jenis mini-game, struktur payload JSON-nya, voice-over script template, dan daftar 18 seed activities untuk MVP (3 level × 2 jalur × 2 mode).

---

## 1. Daftar 7 Mini-Game (MVP)

| #  | Tipe (`ActivityType`)        | Mode utama  | Jalur     | Konsep singkat                                                |
| -- | ---------------------------- | ----------- | --------- | ------------------------------------------------------------- |
| 1  | `HURUF_GAMBAR_MATCHING`      | TK          | Literasi  | Cocokkan huruf awal ke gambar benda                            |
| 2  | `SUSUN_SUKU_KATA`            | TK & SD-1   | Literasi  | Susun 2 suku kata jadi kata                                    |
| 3  | `BACA_KALIMAT_PENDEK`        | SD-1        | Literasi  | Baca kalimat pendek lalu pilih gambar yang sesuai              |
| 4  | `HITUNG_BENDA`               | TK          | Math      | Hitung jumlah benda di gambar, pilih angka                     |
| 5  | `BANDINGKAN_LEBIH_KURANG`    | TK          | Math      | Pilih kelompok benda yang lebih banyak / sedikit               |
| 6  | `PENJUMLAHAN_VISUAL`         | SD-1        | Math      | Soal "3 + 4 = ?" dengan ilustrasi                              |
| 7  | `PENGURANGAN_VISUAL`         | SD-1        | Math      | Soal "7 − 2 = ?" dengan ilustrasi                              |

---

## 2. Spesifikasi Per Mini-Game

Setiap aktivitas memiliki:
- **`id`** unik
- **`type`** salah satu dari 7 di atas
- **`payload`** JSON sesuai schema per type
- **`voiceOverKeys`** referensi ke file MP3
- **Skema bintang** (kriteria 1/2/3 bintang)

### 2.1 `HURUF_GAMBAR_MATCHING` — "Huruf Ajaib"

**Konsep**: Tampilkan 3 huruf (atau slot huruf) di kiri, 3 gambar benda di kanan. Anak drag huruf ke gambar yang berawalan huruf itu.

**Payload schema** (Zod):

```ts
const huruflGambarMatchingPayload = z.object({
  instruction: z.string(), // teks instruksi (juga ada VO)
  pairs: z.array(z.object({
    huruf: z.string().length(1).regex(/^[A-Z]$/),
    gambarKey: z.string(),    // nama file di apps/web/public/img/illustrations/ (URL /img/illustrations/…)
    gambarLabel: z.string(),  // contoh: "Apel", untuk VO feedback
  })).min(3).max(5),
  shuffle: z.boolean().default(true),
});
```

**Contoh payload (level TK Literasi 1)**:

```json
{
  "instruction": "Cocokkan huruf dengan gambarnya!",
  "pairs": [
    { "huruf": "A", "gambarKey": "apel.webp", "gambarLabel": "Apel" },
    { "huruf": "B", "gambarKey": "bola.webp", "gambarLabel": "Bola" },
    { "huruf": "C", "gambarKey": "cangkir.webp", "gambarLabel": "Cangkir" }
  ],
  "shuffle": true
}
```

**Skema bintang**:
- 3 ⭐: tidak ada salah
- 2 ⭐: 1–2 salah
- 1 ⭐: ≥3 salah (tetap selesai semua pasangan)

**Skema XP**:
- Base: 20 XP saat selesai
- + 5 XP per bintang

---

### 2.2 `SUSUN_SUKU_KATA` — "Susun Kata"

**Konsep**: Sebuah gambar benda di atas, dengan 4–6 keping suku kata acak di bawah. Anak drag suku kata ke slot urutan untuk membentuk kata.

**Payload schema**:

```ts
const susunSukuKataPayload = z.object({
  instruction: z.string(),
  questions: z.array(z.object({
    gambarKey: z.string(),
    gambarLabel: z.string(),
    targetKata: z.string(),               // contoh: "BO LA"
    sukuKataKepingan: z.array(z.string()), // contoh: ["BO", "LA", "MA", "PA"]
  })).min(2).max(5),
});
```

**Contoh payload (level TK Literasi 2)**:

```json
{
  "instruction": "Susun suku kata jadi nama benda!",
  "questions": [
    {
      "gambarKey": "bola.webp",
      "gambarLabel": "Bola",
      "targetKata": "BO LA",
      "sukuKataKepingan": ["BO", "LA", "MA", "PA"]
    },
    {
      "gambarKey": "rumah.webp",
      "gambarLabel": "Rumah",
      "targetKata": "RU MAH",
      "sukuKataKepingan": ["RU", "MAH", "BU", "SAH"]
    }
  ]
}
```

**Skema bintang**: sama dengan 2.1.

---

### 2.3 `BACA_KALIMAT_PENDEK` — "Baca dan Pilih"

**Konsep**: Tampilkan kalimat pendek (2–4 kata). Anak baca (atau dengar VO bantuan) lalu pilih 1 dari 3 gambar yang menggambarkan kalimat itu.

**Payload schema**:

```ts
const bacaKalimatPendekPayload = z.object({
  instruction: z.string(),
  questions: z.array(z.object({
    kalimat: z.string(),                  // "Kucing minum susu"
    audioKey: z.string(),                 // VO yang membaca kalimat (opsional bantuan)
    gambarBenar: z.string(),              // key gambar kucing minum susu
    gambarSalah: z.array(z.string()).length(2), // 2 distractor
  })).min(2).max(5),
});
```

**Contoh payload (level SD-1 Literasi 3)**:

```json
{
  "instruction": "Baca kalimat lalu pilih gambar yang benar!",
  "questions": [
    {
      "kalimat": "Adik makan pisang",
      "audioKey": "vo/id/activity/baca-kalimat/adik-makan-pisang.mp3",
      "gambarBenar": "adik-makan-pisang.webp",
      "gambarSalah": ["adik-tidur.webp", "adik-main-bola.webp"]
    },
    {
      "kalimat": "Ayam di kebun",
      "audioKey": "vo/id/activity/baca-kalimat/ayam-di-kebun.mp3",
      "gambarBenar": "ayam-kebun.webp",
      "gambarSalah": ["ayam-kandang.webp", "ayam-rumah.webp"]
    }
  ]
}
```

**Note**: tombol "Dengarkan" muncul di pojok soal — jika anak ragu, bisa dengar VO (bukan otomatis biar mendorong baca).

---

### 2.4 `HITUNG_BENDA` — "Hitung Yuk!"

**Konsep**: Tampilkan ilustrasi sekelompok benda (1–10 buah). Anak hitung, lalu pilih angka jawaban dari 4 pilihan.

**Payload schema**:

```ts
const hitungBendaPayload = z.object({
  instruction: z.string(),
  questions: z.array(z.object({
    bendaKey: z.string(),                 // key ke gambar single (apel)
    bendaLabel: z.string(),               // "apel"
    jumlah: z.number().int().min(1).max(10),
    pilihan: z.array(z.number().int()).length(4),
    jawaban: z.number().int(),
  })).min(3).max(5),
});
```

**Contoh payload (level TK Math 1)**:

```json
{
  "instruction": "Hitung jumlah benda lalu pilih angkanya!",
  "questions": [
    {
      "bendaKey": "apel.webp", "bendaLabel": "apel",
      "jumlah": 3, "pilihan": [2, 3, 4, 5], "jawaban": 3
    },
    {
      "bendaKey": "bunga.webp", "bendaLabel": "bunga",
      "jumlah": 5, "pilihan": [3, 4, 5, 6], "jawaban": 5
    },
    {
      "bendaKey": "kucing.webp", "bendaLabel": "kucing",
      "jumlah": 7, "pilihan": [5, 6, 7, 8], "jawaban": 7
    }
  ]
}
```

---

### 2.5 `BANDINGKAN_LEBIH_KURANG` — "Lebih Banyak Mana?"

**Konsep**: 2 kelompok benda di kiri & kanan. Anak pilih yang lebih banyak (atau lebih sedikit, sesuai instruksi soal).

**Payload schema**:

```ts
const bandingkanLebihKurangPayload = z.object({
  instruction: z.string(),
  questions: z.array(z.object({
    mode: z.enum(['lebih_banyak', 'lebih_sedikit']),
    kiri: z.object({
      bendaKey: z.string(),
      jumlah: z.number().int().min(1).max(10),
    }),
    kanan: z.object({
      bendaKey: z.string(),
      jumlah: z.number().int().min(1).max(10),
    }),
    jawaban: z.enum(['kiri', 'kanan']),
  })).min(3).max(5),
});
```

**Contoh payload (level TK Math 2)**:

```json
{
  "instruction": "Pilih kelompok yang lebih banyak!",
  "questions": [
    {
      "mode": "lebih_banyak",
      "kiri": { "bendaKey": "pisang.webp", "jumlah": 4 },
      "kanan": { "bendaKey": "pisang.webp", "jumlah": 7 },
      "jawaban": "kanan"
    }
  ]
}
```

---

### 2.6 `PENJUMLAHAN_VISUAL` — "Tambah Yuk!"

**Konsep**: Soal `A + B = ?` dengan ilustrasi (misal A apel di kiri, B apel di kanan, total ?). Anak pilih jawaban dari 4 pilihan.

**Payload schema**:

```ts
const penjumlahanVisualPayload = z.object({
  instruction: z.string(),
  questions: z.array(z.object({
    a: z.number().int().min(1).max(15),
    b: z.number().int().min(1).max(15),
    bendaKey: z.string(),
    pilihan: z.array(z.number().int()).length(4),
  })).min(3).max(5),
}).refine((p) => p.questions.every((q) => q.a + q.b <= 20), {
  message: 'Hasil tidak boleh > 20 untuk SD-1',
});
```

**Contoh payload (level SD-1 Math 1)**:

```json
{
  "instruction": "Hitung jumlah totalnya!",
  "questions": [
    { "a": 3, "b": 4, "bendaKey": "bintang.webp", "pilihan": [6, 7, 8, 9] },
    { "a": 5, "b": 5, "bendaKey": "hati.webp", "pilihan": [9, 10, 11, 12] }
  ]
}
```

**Catatan**: `jawaban` tidak disimpan eksplisit (= `a + b`), divalidasi server-side.

---

### 2.7 `PENGURANGAN_VISUAL` — "Kurang Yuk!"

**Konsep**: Mirip 2.6 tapi soal `A − B = ?`. Visualisasi: gambar A benda, lalu animasi B benda "menghilang".

**Payload schema**:

```ts
const penguranganVisualPayload = z.object({
  instruction: z.string(),
  questions: z.array(z.object({
    a: z.number().int().min(2).max(20),
    b: z.number().int().min(1).max(19),
    bendaKey: z.string(),
    pilihan: z.array(z.number().int()).length(4),
  })).min(3).max(5),
}).refine((p) => p.questions.every((q) => q.a - q.b >= 0 && q.a > q.b), {
  message: 'Hasil tidak boleh negatif',
});
```

---

## 3. Discriminated Union — `ActivityPayload`

```ts
export const activityPayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HURUF_GAMBAR_MATCHING'), data: huruflGambarMatchingPayload }),
  z.object({ type: z.literal('SUSUN_SUKU_KATA'), data: susunSukuKataPayload }),
  z.object({ type: z.literal('BACA_KALIMAT_PENDEK'), data: bacaKalimatPendekPayload }),
  z.object({ type: z.literal('HITUNG_BENDA'), data: hitungBendaPayload }),
  z.object({ type: z.literal('BANDINGKAN_LEBIH_KURANG'), data: bandingkanLebihKurangPayload }),
  z.object({ type: z.literal('PENJUMLAHAN_VISUAL'), data: penjumlahanVisualPayload }),
  z.object({ type: z.literal('PENGURANGAN_VISUAL'), data: penguranganVisualPayload }),
]);

export type ActivityPayload = z.infer<typeof activityPayloadSchema>;
```

FE pakai `switch (payload.type)` untuk render komponen yang tepat:

```tsx
function ActivityPlayer({ payload }: { payload: ActivityPayload }) {
  switch (payload.type) {
    case 'HURUF_GAMBAR_MATCHING': return <HuruflGambarMatching data={payload.data} />;
    case 'SUSUN_SUKU_KATA':       return <SusunSukuKata data={payload.data} />;
    case 'BACA_KALIMAT_PENDEK':   return <BacaKalimatPendek data={payload.data} />;
    case 'HITUNG_BENDA':          return <HitungBenda data={payload.data} />;
    case 'BANDINGKAN_LEBIH_KURANG': return <BandingkanLebihKurang data={payload.data} />;
    case 'PENJUMLAHAN_VISUAL':    return <PenjumlahanVisual data={payload.data} />;
    case 'PENGURANGAN_VISUAL':    return <PenguranganVisual data={payload.data} />;
  }
}
```

---

## 4. Voice-Over Script Template

Setiap aktivitas membutuhkan minimal:

| Key                          | Isi                                                                  | Contoh teks                                                  |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `instruksi`                  | Diputar saat aktivitas dibuka                                        | "Yuk, cocokkan huruf dengan gambarnya!"                       |
| `correct[0..2]`              | 1–3 variasi feedback positif (random)                                | "Hebat!", "Pintar!", "Yes, benar!"                            |
| `wrong[0..2]`                | 1–3 variasi feedback gagal (gentle, tidak menyalahkan)               | "Yuk coba lagi!", "Hampir!", "Belum, coba lagi yuk!"           |
| `completion`                 | Diputar saat aktivitas selesai semua soal                            | "Wah, kamu hebat banget!"                                      |
| `prompt[]` (opsional)        | Per soal/pertanyaan (misal: baca kalimat di mini-game baca)          | "Adik makan pisang"                                            |

### Voice talent guideline

- **Suara**: hangat, ramah, ceria — bukan terlalu kekanak-kanakan ("acting" suara bayi).
- **Tempo**: lambat untuk mode TK (anak butuh waktu memproses), normal untuk SD-1.
- **Bahasa**: Indonesia baku tapi alami (boleh "yuk", "ayo"). Hindari kata yang ambigu makna untuk anak.
- **Tone feedback gagal**: TIDAK boleh menyalahkan ("kamu salah!"). Selalu encouraging ("hampir! coba lagi yuk!").

### Naming convention file VO

Path di disk monorepo: **`apps/web/public/audio/`** (URL sama seperti di §5.3 [architecture.md](architecture.md): `play('/audio/…')`).

```
apps/web/public/audio/vo/id/activity/{activityId}/{key}.mp3
apps/web/public/audio/vo/id/activity/{activityId}/correct-1.mp3
apps/web/public/audio/vo/id/activity/{activityId}/wrong-1.mp3
apps/web/public/audio/vo/id/feedback/great-1.mp3   (shared)
```

---

## 5. Daftar 12 Level + 18 Aktivitas Seed (MVP)

### 5.1 Mode TK — Literasi

| Level | ID                | Title                                | Aktivitas                                                |
| ----- | ----------------- | ------------------------------------ | -------------------------------------------------------- |
| 1     | `tk-literasi-1`   | Mengenal Huruf A–E                  | 1. Huruf Ajaib A–E (HURUF_GAMBAR_MATCHING)               |
| 2     | `tk-literasi-2`   | Suku Kata BA, BI, BU, BE, BO        | 1. Susun Suku Kata Sederhana (SUSUN_SUKU_KATA)           |
| 3     | `tk-literasi-3`   | Kata Benda Dekat                    | 1. Susun Nama Benda di Rumah (SUSUN_SUKU_KATA)           |

### 5.2 Mode TK — Matematika

| Level | ID                | Title                                | Aktivitas                                                |
| ----- | ----------------- | ------------------------------------ | -------------------------------------------------------- |
| 1     | `tk-math-1`       | Mengenal Angka 1–5                  | 1. Hitung Buah-Buahan (HITUNG_BENDA)                     |
| 2     | `tk-math-2`       | Mengenal Angka 6–10                 | 1. Hitung Hewan-Hewan (HITUNG_BENDA)                     |
| 3     | `tk-math-3`       | Banding Kelompok                    | 1. Lebih Banyak Mana? (BANDINGKAN_LEBIH_KURANG)          |

### 5.3 Mode SD-1 — Literasi

| Level | ID                | Title                                | Aktivitas                                                |
| ----- | ----------------- | ------------------------------------ | -------------------------------------------------------- |
| 1     | `sd1-literasi-1`  | Suku Kata Lanjutan                  | 1. Susun Kata 2 Suku (SUSUN_SUKU_KATA)                   |
| 2     | `sd1-literasi-2`  | Membaca Kata                        | 1. Susun Kata 3 Suku (SUSUN_SUKU_KATA)                   |
| 3     | `sd1-literasi-3`  | Membaca Kalimat Pendek              | 1. Baca dan Pilih Gambar (BACA_KALIMAT_PENDEK)           |

### 5.4 Mode SD-1 — Matematika

| Level | ID                | Title                                | Aktivitas                                                |
| ----- | ----------------- | ------------------------------------ | -------------------------------------------------------- |
| 1     | `sd1-math-1`      | Penjumlahan 1–10                    | 1. Tambah Yuk! 1–10 (PENJUMLAHAN_VISUAL)                 |
| 2     | `sd1-math-2`      | Penjumlahan 11–20                   | 1. Tambah Yuk! 11–20 (PENJUMLAHAN_VISUAL)                |
| 3     | `sd1-math-3`      | Pengurangan 1–10                    | 1. Kurang Yuk! 1–10 (PENGURANGAN_VISUAL)                 |

> **Total**: 12 level × 1 aktivitas = **12 aktivitas inti**. Tambahan 6 aktivitas opsional (level 1 & 2 setiap jalur dapat aktivitas kedua untuk variasi) sehingga total ~18 aktivitas seed siap launch.

### 5.5 Aktivitas Tambahan (Variasi)

Untuk tiap level 1 & 2 di setiap jalur+mode (8 level), tambahkan 1 aktivitas variasi (mini-game tipe lain dari konten yang sama). Contoh:

- `tk-literasi-1` aktivitas 2: lagi-lagi A–E tapi pakai mini-game `SUSUN_SUKU_KATA` sederhana.
- `tk-math-1` aktivitas 2: angka 1–5 dengan `BANDINGKAN_LEBIH_KURANG` skala kecil.
- `sd1-math-1` aktivitas 2: penjumlahan 1–10 dengan format soal beda (misal `PENJUMLAHAN_VISUAL` dengan visual berbeda).

Total: 12 + 6 = **18 aktivitas** untuk MVP.

---

## 6. Contoh Seed (TypeScript)

`prisma/seed.ts` (cuplikan konsep):

```ts
import { prisma } from './client';

await prisma.levelDefinition.upsert({
  where: { id: 'tk-literasi-1' },
  update: {},
  create: {
    id: 'tk-literasi-1',
    track: 'literasi',
    ageMode: 'TK',
    order: 1,
    title: 'Mengenal Huruf A–E',
    description: 'Yuk kenalan dengan huruf A, B, C, D, dan E!',
    iconKey: 'huruf-block-abc',
  },
});

await prisma.activityDefinition.upsert({
  where: { id: 'tk-literasi-1-act1' },
  update: {},
  create: {
    id: 'tk-literasi-1-act1',
    levelId: 'tk-literasi-1',
    type: 'HURUF_GAMBAR_MATCHING',
    order: 1,
    title: 'Huruf Ajaib A–E',
    estimatedSec: 180,
    payload: JSON.stringify({
      instruction: 'Cocokkan huruf dengan gambarnya!',
      pairs: [
        { huruf: 'A', gambarKey: 'apel.webp', gambarLabel: 'Apel' },
        { huruf: 'B', gambarKey: 'bola.webp', gambarLabel: 'Bola' },
        { huruf: 'C', gambarKey: 'cangkir.webp', gambarLabel: 'Cangkir' },
        { huruf: 'D', gambarKey: 'durian.webp', gambarLabel: 'Durian' },
        { huruf: 'E', gambarKey: 'es-krim.webp', gambarLabel: 'Es Krim' },
      ],
      shuffle: true,
    }),
    voiceOverKeys: JSON.stringify({
      instruksi: 'vo/id/activity/tk-literasi-1-act1/instruksi.mp3',
      correct: ['vo/id/feedback/great-1.mp3', 'vo/id/feedback/great-2.mp3'],
      wrong: ['vo/id/feedback/try-again-1.mp3', 'vo/id/feedback/try-again-2.mp3'],
      completion: 'vo/id/activity/tk-literasi-1-act1/completion.mp3',
    }),
  },
});
```

---

## 7. Sticker Catalog (Seed)

30 stiker awal dengan tema bervariasi untuk menyemangati anak.

### 7.1 Common (10 stiker — 70% drop rate)

| ID                          | Nama              | Tema       |
| --------------------------- | ----------------- | ---------- |
| `sticker-bintang-emas`      | Bintang Emas      | universal  |
| `sticker-pita-pelangi`      | Pita Pelangi      | universal  |
| `sticker-balon-hati`        | Balon Hati        | universal  |
| `sticker-apel-merah`        | Apel Merah        | buah       |
| `sticker-pisang-kuning`     | Pisang Kuning     | buah       |
| `sticker-bunga-matahari`    | Bunga Matahari    | tumbuhan   |
| `sticker-kucing-oranye`     | Kucing Oranye     | hewan      |
| `sticker-anjing-coklat`     | Anjing Coklat     | hewan      |
| `sticker-mobil-merah`       | Mobil Merah       | kendaraan  |
| `sticker-pesawat-biru`      | Pesawat Biru      | kendaraan  |

### 7.2 Rare (10 stiker — 25% drop rate)

| ID                          | Nama              | Tema       |
| --------------------------- | ----------------- | ---------- |
| `sticker-panda-bahagia`     | Panda Bahagia     | hewan      |
| `sticker-gajah-kecil`       | Gajah Kecil       | hewan      |
| `sticker-dinosaurus-hijau`  | Dinosaurus Hijau  | hewan      |
| `sticker-kapal-bajak-laut`  | Kapal Bajak Laut  | kendaraan  |
| `sticker-helikopter`        | Helikopter        | kendaraan  |
| `sticker-pelangi`           | Pelangi           | universal  |
| `sticker-ketupat`           | Ketupat           | budaya ID  |
| `sticker-wayang`            | Wayang            | budaya ID  |
| `sticker-batik`             | Motif Batik       | budaya ID  |
| `sticker-rumah-gadang`      | Rumah Gadang      | budaya ID  |

### 7.3 Epic (10 stiker — 5% drop rate)

| ID                              | Nama                  | Tema           |
| ------------------------------- | --------------------- | -------------- |
| `sticker-roket-luar-angkasa`    | Roket Luar Angkasa    | sains          |
| `sticker-naga-merah`            | Naga Merah            | fantasi        |
| `sticker-unicorn-pelangi`       | Unicorn Pelangi       | fantasi        |
| `sticker-kupu-kupu-emas`        | Kupu-Kupu Emas        | hewan          |
| `sticker-istana-pasir`          | Istana Pasir          | tempat         |
| `sticker-bintang-jatuh`         | Bintang Jatuh         | universal      |
| `sticker-mahkota-raja`          | Mahkota Raja          | universal      |
| `sticker-mascot-bimo-superhero` | Bimo Superhero        | mascot         |
| `sticker-mascot-bimo-pilot`     | Bimo Pilot            | mascot         |
| `sticker-trofi-emas`            | Trofi Emas            | achievement    |

---

## 8. Badge Catalog (Seed)

7 badge MVP dengan kriteria yang jelas dan attainable:

| ID                    | Code                  | Nama                | Kriteria (`criteriaKey`)         | Deskripsi                           |
| --------------------- | --------------------- | ------------------- | -------------------------------- | ----------------------------------- |
| `badge-first-step`    | `FIRST_STEP`          | Petualang Pertama   | `activity_complete_count_1`      | Selesaikan aktivitas pertamamu!     |
| `badge-three-stars`   | `THREE_STARS`         | Bintang Tiga        | `first_three_stars`              | Dapatkan 3 bintang pertamamu        |
| `badge-streak-3`      | `STREAK_3`            | Streak 3 Hari       | `streak_days_3`                  | Bermain 3 hari berturut-turut       |
| `badge-streak-7`      | `STREAK_7`            | Streak 7 Hari       | `streak_days_7`                  | Bermain 7 hari berturut-turut       |
| `badge-master-lit-1`  | `MASTER_LIT_1`        | Master Literasi 1   | `level_master:literasi:1`        | Mastered semua aktivitas Level 1 Literasi |
| `badge-master-math-1` | `MASTER_MATH_1`       | Master Matematika 1 | `level_master:math:1`            | Mastered semua aktivitas Level 1 Matematika |
| `badge-collector-5`   | `COLLECTOR_5`         | Kolektor Pemula     | `sticker_count_5`                | Kumpulkan 5 stiker                  |

### Implementasi `criteriaKey`

Evaluasi badge/progres terkait ada di layanan API (mis. alur `submit-activity` dan mastery); contoh pola map evaluator:

```ts
const badgeEvaluators: Record<string, (childId: string) => Promise<boolean>> = {
  'activity_complete_count_1': async (childId) => {
    const count = await prisma.progress.count({ where: { childId, firstCompletedAt: { not: null } } });
    return count >= 1;
  },
  'first_three_stars': async (childId) => {
    const count = await prisma.progress.count({ where: { childId, bestStars: 3 } });
    return count >= 1;
  },
  'streak_days_3': async (childId) => {
    const s = await prisma.dailyStreak.findUnique({ where: { childId } });
    return (s?.currentStreak ?? 0) >= 3;
  },
  // ... dst
};
```

---

## 9. Asset Production Checklist

Untuk setiap aktivitas seed, butuh:

- [ ] Gambar ilustrasi benda (WebP 512×512, transparent bg)
- [ ] VO `instruksi.mp3`
- [ ] VO `completion.mp3`
- [ ] (jika type membutuhkan) VO per soal (misal: `BACA_KALIMAT_PENDEK`)

Untuk shared:

- [ ] 6 VO feedback positif (`great-1.mp3` s/d `great-6.mp3`)
- [ ] 6 VO feedback gagal (`try-again-1.mp3` s/d `try-again-6.mp3`)
- [ ] 5 VO transisi UI (welcome, pilih-mode, ganti-anak, break-time, cap-reached)
- [ ] 6 SFX (correct, wrong, click-button, drag-pickup, drag-drop, level-up)
- [ ] 1 BGM dashboard (loopable, ~1 menit)
- [ ] 1 BGM gameplay (lebih tenang, loopable)

**Estimasi**: ~50 file audio + ~50 file gambar untuk MVP.

---

## 10. Open Questions

- [ ] Apakah anak boleh skip ke aktivitas berikutnya jika tidak suka satu mini-game (replace)? Atau harus selesai semua aktivitas level untuk unlock berikutnya? **Default**: harus selesai semua.
- [ ] Berapa banyak soal per aktivitas yang ideal? Saat ini: 3–5. Perlu validasi UAT.
- [ ] Tema kontekstual: apakah perlu tema mingguan (misal: minggu ini "Kebun Binatang", semua aktivitas bertema hewan)? **Default MVP**: tidak, post-MVP.
- [ ] Apakah perlu mode "ulang aktivitas dengan soal random baru" (procedural)? **Default MVP**: soal statis (lebih mudah review konten), procedural di Phase 4+.
