# Baseline Lighthouse (PWA & aksesibilitas)

Target produk dari [roadmap.md](roadmap.md) §5.3 dan [recommendations.md](recommendations.md) §7.3:

- **Performance**: ≥85
- **Accessibility**: ≥95
- **Best Practices**: sejajar garis depan Chromium
- **PWA**: ≥90

## Menjalankan audit

Gunakan Chromium + Lighthouse CLI setelah **`pnpm install`**:

```bash
pnpm build && pnpm preview &
# Di tab lain tunggu http://localhost:4173 atau port yang ditulis Vite preview, lalu:
pnpm dlx lighthouse http://localhost:4173/ \
  --only-categories=performance,accessibility,best-practices,pwa \
  --output html --output-path ./lighthouse-report.html
```

Atau Lighthouse bawaan Chrome DevTools (**More tools → Lighthouse**).

- Uji beberapa rute utama: `/` (pemilih pemain), `/parent` (form PIN), serta satu jalur bermain aktif `/p/:childId` jika data lokal ada.
- Nonaktifkan ekstensi peramban; pakai sesi baru / jendela incognito bila ada noise.

## Mengisi baseline

Setelah pertama kali mengaudit, lengkapi tabel tanggal/skor di repo atau catatan sprint:

| Tanggal | URL/base | Perf | A11y | BP | PWA |
| ------- | -------- | ---: | ---: | -- | --: |

## Action item aksesibilitas (lanjutan)

Kebijakan rutin ketika menambah UI:

1. Kontrol interaktif punya nama yang dapat dibaca pembaca layar (`aria-label`, `aria-labelledby`, atau teks yang terlihat).
2. Fokus kibord terlihat (`focus-visible`); modal memakai **`<dialog>` + `showModal()`** atau komponen dengan perangkap fokus.
3. Status dinamis menggunakan `aria-live="polite"` atau `role="status"` konsisten untuk umpan singkat bagi pembaca layar.
4. Periksa rasio kontras teks/tombol utama terhadap latar (`#2563eb` vs putih telah di-set di tema; sekali-kali jalankan Lighthouse pada layar baru).

Setelah ada angka Lighthouse riil, salin satu temuan utama per kategori dan PR yang memperbaikinya ke blok di atas atau ke issue tracker.
