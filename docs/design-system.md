# Design System — Game Edukatif Anak

Panduan visual & audio untuk membangun pengalaman yang konsisten, ramah anak, dan aman secara aksesibilitas. Dokumen ini menjadi referensi untuk komponen UI, mascot, animasi, dan asset audio.

---

## 1. Prinsip Desain

1. **Big & Friendly** — semua elemen interaktif besar (≥48 px), bentuk membulat, tidak runcing.
2. **Cheerful but not Overstimulating** — warna ceria tapi terkontrol; animasi singkat (≤2 detik).
3. **Audio-First Instruction** — anak TK belum bisa baca; setiap layar ada narasi suara.
4. **Forgiving Feedback** — tidak ada "kamu salah" yang tegas; selalu encouraging.
5. **Predictable Layout** — pola layout konsisten antar mini-game agar anak cepat familiar.
6. **Cultural Relevance** — gambar & contoh kontekstual Indonesia (apel, ketupat, batik, dll.).

---

## 2. Color Palette

Palette dipilih dengan **kontras WCAG AA** (≥4.5:1 untuk teks normal, ≥3:1 untuk teks besar/komponen).

### 2.1 Primary (warna utama UI)

| Token             | Hex      | Penggunaan                                    |
| ----------------- | -------- | --------------------------------------------- |
| `--color-primary-500` | `#FF8A3D` | Tombol utama, accent, brand mascot          |
| `--color-primary-600` | `#E5722A` | Hover state                                  |
| `--color-primary-100` | `#FFE9D6` | Background lembut                            |
| `--color-primary-50`  | `#FFF6EE` | Subtle highlight                             |

> **Mengapa oranye hangat?** Warna oranye membangkitkan keceriaan tanpa terlalu intens seperti merah, dan lebih neutral gender daripada pink/biru.

### 2.2 Secondary (per jalur belajar)

| Token             | Hex      | Penggunaan                                    |
| ----------------- | -------- | --------------------------------------------- |
| `--color-literasi-500` | `#5B8DEF` | Identitas jalur Literasi (biru langit)      |
| `--color-literasi-100` | `#DCE8FB` | Background literasi                          |
| `--color-math-500`     | `#34C7A0` | Identitas jalur Matematika (hijau mint)     |
| `--color-math-100`     | `#D4F2E8` | Background matematika                        |

### 2.3 Semantic

| Token             | Hex      | Penggunaan                                |
| ----------------- | -------- | ----------------------------------------- |
| `--color-success` | `#3CB371` | Feedback benar, bintang earned            |
| `--color-warning` | `#F4B400` | Streak counter, badge                      |
| `--color-error`   | `#E07A5F` | Feedback salah (lembut, BUKAN merah cerah) |
| `--color-info`    | `#5B8DEF` | Info, hint                                |

> **Catatan**: error pakai `#E07A5F` (terracotta) bukan red/crimson — terasa lebih hangat & tidak menghukum.

### 2.4 Neutral

| Token             | Hex      | Penggunaan                                |
| ----------------- | -------- | ----------------------------------------- |
| `--color-bg`      | `#FFFBF5` | Background utama (off-white hangat)       |
| `--color-bg-card` | `#FFFFFF` | Card background                           |
| `--color-text`    | `#2D2D2D` | Teks utama (kontras 14:1 di atas bg)      |
| `--color-text-muted` | `#6B6B6B` | Teks sekunder                          |
| `--color-border`  | `#E5DFD3` | Border halus                              |

### 2.5 Mapping Tailwind

`tailwind.config.ts` (extend):

```ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF6EE', 100: '#FFE9D6', 500: '#FF8A3D', 600: '#E5722A',
        },
        literasi: { 100: '#DCE8FB', 500: '#5B8DEF' },
        math: { 100: '#D4F2E8', 500: '#34C7A0' },
        success: '#3CB371', warning: '#F4B400', error: '#E07A5F', info: '#5B8DEF',
        ink: { DEFAULT: '#2D2D2D', muted: '#6B6B6B' },
        canvas: { DEFAULT: '#FFFBF5', card: '#FFFFFF' },
      },
    },
  },
};
```

### 2.6 Dark Mode (Post-MVP)

Tidak diprioritaskan untuk MVP. Anak biasanya main siang, dan dark mode untuk konten kid-friendly malah mengurangi keceriaan visual.

---

## 3. Typography

### 3.1 Font Family

| Token              | Font (rekomendasi) | Penggunaan                             |
| ------------------ | ------------------ | -------------------------------------- |
| `--font-display`   | **Fredoka** (rounded sans, playful) | Heading, button label, judul aktivitas |
| `--font-body`      | **Nunito** (rounded sans, neutral)  | Body text, instruksi, parent dashboard |
| `--font-mono`      | (jarang dipakai)   | Hanya jika perlu (debug, tidak untuk anak) |

> Kedua font tersedia gratis di Google Fonts dengan Latin extended (mendukung karakter Indonesia).

### 3.2 Skala Ukuran

Mengingat target anak 4–8 tahun: minimal 18px untuk teks anak.

| Token         | Size | Line height | Penggunaan                              |
| ------------- | ---- | ----------- | --------------------------------------- |
| `--text-hero` | 48px | 1.2         | Layar welcome, level-up                 |
| `--text-h1`   | 32px | 1.3         | Judul halaman utama                     |
| `--text-h2`   | 24px | 1.3         | Judul card, judul aktivitas              |
| `--text-h3`   | 20px | 1.4         | Sub-heading                             |
| `--text-body` | 18px | 1.5         | Teks body untuk anak                    |
| `--text-small`| 14px | 1.4         | HANYA untuk parent dashboard            |

**Aturan**: di mode anak, jangan pernah pakai teks <16px.

### 3.3 Font Weight

- `400 Regular` — body
- `600 SemiBold` — heading
- `700 Bold` — emphasis, button
- `800 ExtraBold` — hero text only

---

## 4. Spacing & Sizing

### 4.1 Spacing Scale (mengikuti Tailwind default)

`4px` base unit. Spasi paling sering: `8`, `12`, `16`, `24`, `32`, `48`, `64`.

### 4.2 Touch Target

| Element                | Min size  | Padding clickable area |
| ---------------------- | --------- | ---------------------- |
| Tombol utama (action)  | 56×56 px  | 12 px padding          |
| Tombol sekunder        | 48×48 px  | 8 px padding           |
| Card aktivitas         | 96×96 px  | 16 px padding          |
| Avatar pilihan         | 80×80 px  | 8 px padding           |
| Drag handle            | 64×64 px  | 8 px padding           |
| Drop zone target       | 96×96 px  | 16 px padding          |

### 4.3 Border Radius

| Token            | Value | Penggunaan                       |
| ---------------- | ----- | -------------------------------- |
| `--radius-sm`    | 8px   | Tag, chip                        |
| `--radius-md`    | 16px  | Tombol, input                    |
| `--radius-lg`    | 24px  | Card, modal                      |
| `--radius-pill`  | 999px | Avatar, badge bulat              |

> Hindari `radius: 0` (square sharp); selalu rounded untuk feel ramah anak.

### 4.4 Shadow

Soft, tidak terlalu dalam:

```css
--shadow-sm: 0 2px 4px rgba(45, 45, 45, 0.06);
--shadow-md: 0 4px 12px rgba(45, 45, 45, 0.10);
--shadow-lg: 0 8px 24px rgba(45, 45, 45, 0.14);
--shadow-glow-success: 0 0 16px rgba(60, 179, 113, 0.4);
```

---

## 5. Mascot — "Bimo si Gajah Kecil"

### 5.1 Konsep

- Karakter pendamping yang muncul untuk:
  - Memberi instruksi (di onboarding & per aktivitas)
  - Memberi semangat saat anak salah ("Yuk coba lagi!")
  - Merayakan keberhasilan (high-five, joget kecil)

### 5.2 Spesifikasi Visual

| Atribut       | Nilai                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Spesies       | Gajah kecil (universal, cute, tidak terikat budaya tertentu)            |
| Warna utama   | Oranye `#FF8A3D` (selaras dengan brand color)                           |
| Warna telinga | Pink lembut `#FFC4D6`                                                  |
| Aksesori      | Pita kecil di telinga (opsional, untuk variasi seasonal post-MVP)       |
| Style         | Flat illustration dengan outline lembut, bukan realistic                |
| Size          | Default 120×120 px di dashboard, 80×80 px sebagai sidekick di aktivitas |

### 5.3 Pose / Expression yang Dibutuhkan

- **Idle**: berdiri, senyum ramah
- **Talking**: mulut sedikit terbuka (loop animasi mouth)
- **Happy**: tangan ke atas, mata berbinar
- **Encouraging** (untuk feedback gagal): senyum sambil mengangkat satu tangan
- **Celebrating**: confetti, joget kecil
- **Sleeping** (untuk daily cap reached): mata tertutup, ZZZ kecil

### 5.4 Format Asset

- Lottie JSON untuk pose dengan animasi (talking, celebrating)
- SVG static untuk pose idle / placeholder
- Disimpan di `public/img/mascot/` dan `public/lottie/mascot/`

---

## 6. Iconography

### 6.1 Style

- **Outline + filled**: outline 2px, fill warna primary
- Rounded corners (`stroke-linecap: round`)
- Konsisten size 24×24 base, scale up via CSS

### 6.2 Icon Set

Pakai **Phosphor Icons** atau **Lucide** (keduanya open-source, rounded variants tersedia). Hindari Material Icons (terlalu serius).

### 6.3 Custom Icon

Untuk konteks game (huruf, angka, bintang, dll.), buat custom illustrated icons di `public/img/icons/`.

---

## 7. Component Patterns

### 7.1 Button Variants

| Variant          | Usage                                | Style                                      |
| ---------------- | ------------------------------------ | ------------------------------------------ |
| **Primary**      | Aksi utama (Mulai, Selesai)          | Bg `--color-primary-500`, text white, big shadow |
| **Secondary**    | Aksi sekunder                        | Bg white, border `--color-primary-500`     |
| **Ghost**        | Tertiary (skip, batal)               | Transparent, text `--color-text-muted`     |
| **Icon-only**    | Settings, exit, hint                 | 48×48 circle, soft shadow                  |
| **Activity-card**| Pilih aktivitas dari level           | Large card 200×200, illustration center    |

Semua tombol primary punya:
- Bounce micro-animation saat hover/tap
- SFX click (`click-button.mp3`) saat ditekan

### 7.2 Card Patterns

- **Activity Card**: ilustrasi besar (60% area) + judul (20%) + bintang earned (20%)
- **Level Card**: ikon level + judul + progress bar + status (locked/unlocked/mastered)
- **Stat Card** (parent): angka besar + label + ikon

### 7.3 Modal Patterns

- **Reward Modal**: full-screen overlay dengan animasi confetti, mascot celebrating, bintang muncul satu-satu (delay 300ms each)
- **Break Reminder Modal**: half-screen, mascot sleeping, tombol "Lanjut" muncul setelah 5 detik delay (anti-skip impulsif)
- **PIN Modal (parent)**: numpad besar (60×60 button), input 4 digit dengan dot indicator
- **Confirm Delete (parent)**: 2-step confirmation untuk safety

---

## 8. Animation Guidelines

### 8.1 Library

- **Framer Motion** untuk transisi React component & gesture (drag-drop)
- **CSS Transitions** untuk hover/focus state sederhana
- **Lottie** untuk animasi reward kompleks (confetti, celebration)

### 8.2 Durasi & Easing

| Tipe                       | Durasi      | Easing                  |
| -------------------------- | ----------- | ----------------------- |
| Hover/focus state          | 150–200 ms  | ease-out                |
| Page transition            | 300 ms      | ease-in-out             |
| Modal enter                | 400 ms      | spring (stiffness 200)  |
| Reward animation (bintang) | 600 ms each | spring (stiffness 150, damping 10) |
| Confetti                   | 1500–2000 ms| linear (Lottie default) |
| Mascot idle loop           | 3 s         | linear loop             |
| Drag pickup                | 100 ms      | ease-out, scale 1.1     |

### 8.3 Aturan

- **No animation longer than 2 seconds** (kecuali looping idle).
- **No flashing** — frekuensi <3 Hz (anti-seizure WCAG).
- **Respect `prefers-reduced-motion`**: jika user/parent set, ganti animasi besar dengan fade sederhana.

### 8.4 Reward Animation Sequence

Saat anak selesai aktivitas dengan 3 bintang:

```
0.0s  - Background dim ke 60%
0.3s  - Mascot zoom in dari kiri (spring)
0.6s  - Bintang 1 pop in dengan SFX "ding"
0.9s  - Bintang 2 pop in dengan SFX "ding"
1.2s  - Bintang 3 pop in dengan SFX "ding-up" (lebih tinggi)
1.5s  - VO completion play ("Wah, kamu hebat banget!")
1.8s  - Confetti Lottie play
2.5s  - Tombol "Lanjut" muncul (slide up)
```

---

## 9. Audio Design

### 9.1 SFX Library (MVP)

| File                     | Durasi   | Kapan diputar                       | Karakter                  |
| ------------------------ | -------- | ----------------------------------- | ------------------------- |
| `correct.mp3`            | 400 ms   | Anak jawab benar                    | High pitched chime, ceria |
| `wrong.mp3`              | 500 ms   | Anak jawab salah                    | Soft bonk, NOT harsh      |
| `click-button.mp3`       | 100 ms   | Tap tombol                          | Short pop                 |
| `drag-pickup.mp3`        | 200 ms   | Mulai drag                          | Soft whoosh               |
| `drag-drop.mp3`          | 200 ms   | Lepas drag (di drop zone)           | Soft thud                 |
| `level-up.mp3`           | 1500 ms  | Level baru di-unlock                | Triumphant fanfare        |
| `star-1.mp3` / `2` / `3` | 200 ms each | Bintang muncul satu-satu          | Ascending pitch           |
| `sticker-earned.mp3`     | 800 ms   | Sticker baru didapat                | Magical sparkle           |
| `badge-earned.mp3`       | 1000 ms  | Badge baru didapat                  | Celebratory chime         |
| `reminder-break.mp3`     | 500 ms   | Modal break reminder muncul         | Soft bell                 |

### 9.2 BGM (MVP)

| File                     | Mood                            | Loop length | Volume default |
| ------------------------ | ------------------------------- | ----------- | -------------- |
| `bgm-dashboard.mp3`      | Playful, upbeat, instrumental   | 60–90 s     | 30%            |
| `bgm-gameplay.mp3`       | Calm, focused, gentle           | 60–90 s     | 25%            |
| `bgm-celebration.mp3`    | Triumphant, short stinger       | 8–10 s      | 50%            |

**Aturan**:
- BGM **tidak pernah** menutupi VO. Saat VO aktif → ducking BGM ke 30% dari volume settings.
- BGM **dapat di-toggle off** di parent settings.
- BGM auto-pause saat tab tidak focus.

### 9.3 VO Production Standard

- **Format**: MP3 192 kbps, mono, normalized -16 LUFS
- **Sample rate**: 44.1 kHz
- **Naming**: lowercase-with-dash, no Indonesian special characters di filename
- **Voice talent rekomendasi**: native Indonesian speaker, female (riset: anak <8 lebih responsif suara perempuan), warm tone

---

## 10. Layout Patterns

### 10.1 Breakpoints

| Name    | Width     | Target device                    |
| ------- | --------- | -------------------------------- |
| `mobile`| <768 px   | Anak main di HP (less ideal)     |
| `tablet`| 768–1023 px | iPad / tablet (PRIMARY!)       |
| `desktop` | ≥1024 px | Desktop (parent dashboard mostly) |

> **Optimasi utama**: tablet portrait (768×1024). Game anak idealnya dimainkan di tablet.

### 10.2 Grid Patterns

| Layout                | Grid                                                |
| --------------------- | --------------------------------------------------- |
| Profile picker        | 2×2 atau 1×4 (max 4 profil)                         |
| Level map             | 1 kolom (vertical scroll), card 90% width           |
| Activity selector     | 2 kolom (mobile/tablet), 3 kolom (desktop)          |
| Sticker album         | 4 kolom (tablet), 5 kolom (desktop)                 |
| Parent dashboard      | 2 kolom: sidebar nav + main content                 |

### 10.3 Safe Area

Pakai `env(safe-area-inset-*)` untuk PWA installed di iOS (notch, home indicator).

---

## 11. Accessibility Checklist

### 11.1 Visual

- [ ] Semua teks min 16px (anak: min 18px)
- [ ] Kontras WCAG AA (≥4.5:1 teks, ≥3:1 komponen)
- [ ] Focus state visible (untuk navigasi keyboard parent area)
- [ ] No info dengan warna saja (juga ada ikon/label)
- [ ] `prefers-reduced-motion` dihormati

### 11.2 Audio

- [ ] Setiap instruksi punya VO (anak TK)
- [ ] VO bisa di-replay (tombol "Dengarkan lagi")
- [ ] Caption tersedia di parent area (post-MVP)
- [ ] Tidak ada audio yang tiba-tiba keras

### 11.3 Interaction

- [ ] Touch target ≥48×48 px
- [ ] No double-tap requirement
- [ ] No long-press requirement (anak susah)
- [ ] No time pressure punitive
- [ ] Drag & drop punya alternatif tap (untuk anak yang motoriknya belum)

### 11.4 Keyboard (Parent Area)

- [ ] Semua interaksi parent area bisa dengan keyboard
- [ ] Tab order logical
- [ ] Escape menutup modal

---

## 12. Component Checklist (MVP)

Komponen yang harus dibangun di Phase 0–2:

### Atomic
- [ ] `Button` (primary, secondary, ghost, icon-only)
- [ ] `Card` (default, activity-card, level-card)
- [ ] `Modal` (default, reward, break-reminder, pin)
- [ ] `Avatar`
- [ ] `Star` (filled, outlined, animated-pop-in)
- [ ] `ProgressBar` (level progress)
- [ ] `Badge` (sticker thumbnail, badge thumbnail)
- [ ] `Numpad` (untuk PIN input)

### Compound
- [ ] `MascotBubble` (mascot + speech bubble + VO playback)
- [ ] `LevelCard`
- [ ] `ActivityCard`
- [ ] `StickerSlot` (di album, kosong vs filled)
- [ ] `StreakBanner` (di dashboard)
- [ ] `XpBar`
- [ ] `RewardModal`
- [ ] `BreakReminderModal`
- [ ] `PinModal`
- [ ] `ProfilePickerCard`

### Layout
- [ ] `KidShell` (layout untuk semua mode anak: header simple, no parent nav)
- [ ] `ParentShell` (layout parent area: sidebar + content)
- [ ] `ActivityShell` (full-screen, exit button kiri atas, mascot bottom-right)

---

## 13. Asset Production Workflow

### 13.1 Tools (Rekomendasi)

| Asset Type        | Tool                              |
| ----------------- | --------------------------------- |
| Illustration (vector) | Figma / Affinity Designer     |
| Illustration (raster) | Procreate / Photoshop          |
| Mascot animation  | After Effects + Bodymovin → Lottie|
| SFX               | Freesound.org (CC) / Bfxr (procedural) / Soundstripe |
| BGM               | Soundstripe / Epidemic Sound / open-source CC0 |
| VO                | Studio recording / ElevenLabs (premium TTS) |
| Image optimization | Squoosh / sharp CLI              |

### 13.2 File Convention

- Original di repo terpisah (`assets-source/`) atau Google Drive (jangan masuk ke `git`).
- Optimized output di `public/` ikuti struktur yang sudah didefinisikan di [architecture.md](architecture.md).
- Naming: lowercase-with-dash, descriptive: `apel.webp`, BUKAN `IMG_001.png`.

---

## 14. Brand Voice & Microcopy

### 14.1 Tone

- Hangat, ramah, encouraging
- Pakai sapaan "kamu" (informal Indonesia)
- Boleh "yuk", "ayo"
- Hindari kata negatif menghukum

### 14.2 Examples

| Konteks          | Bagus ✓                              | Hindari ✗                           |
| ---------------- | ------------------------------------ | ----------------------------------- |
| Welcome          | "Halo! Yuk main bersama Bimo!"        | "Selamat datang di aplikasi"         |
| Salah            | "Hampir! Coba lagi yuk!"              | "Salah! Jawaban kamu tidak benar."   |
| Benar            | "Hebat! Kamu pintar!"                 | "Correct."                           |
| Level up         | "Wah, kamu naik level! Selamat!"       | "Anda telah naik level."             |
| Daily cap        | "Sudah cukup hari ini! Sampai jumpa besok ya!" | "Anda mencapai batas waktu harian." |
| PIN salah        | "Hmm, PIN-nya belum tepat. Coba lagi?" | "PIN salah. Coba lagi."              |

---

## 15. Open Questions

- [ ] Mascot: apakah Bimo cukup atau perlu lebih dari 1 (misal: companion bisa dipilih)? **Default MVP**: 1 mascot saja.
- [ ] Apakah perlu dark mode di parent area? **Default MVP**: tidak (light only).
- [ ] Voice talent: rekam profesional vs ElevenLabs vs voice indah-tapi-amatir? **Rekomendasi**: ElevenLabs untuk MVP (cost effective + kualitas tinggi), rekam manusia di Phase 4+ jika budget memungkinkan.
- [ ] Tema seasonal (Lebaran, Natal, dll.): apakah mascot ganti aksesori? **Default MVP**: tidak, post-MVP.
