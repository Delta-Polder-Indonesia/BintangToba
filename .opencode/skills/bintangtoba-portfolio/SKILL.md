---
name: bintangtoba-portfolio
description: Maintain the Bintang Toba React/Vite portfolio with bilingual content, minimalist academic styling, and smooth light/dark mode.
metadata:
  project: BintangToba
  stack: React, Vite, CSS
---

# BintangToba Portfolio Skill

## Purpose

Use this skill when editing the Bintang Toba personal portfolio. Keep the site clean, personal, fast, accessible, and consistent with the current minimalist academic layout.

## Core rules

- Keep the portfolio identity centered on Bintang Toba.
- Do not add comments, visible text, metadata, class names, docs, or asset names that credit or name outside reference websites/designs.
- Keep the Indonesian and English content available unless the user explicitly asks to remove a language.
- Keep both navbar controls visible:
  - language toggle: ID/EN with flag
  - theme toggle: moon/sun for light/dark
- Preserve the profile photo and biography paragraphs unless the user asks to change them.
- Prefer small, intentional UI changes over flashy effects.
- Keep color and layout tokens in CSS variables so light/dark mode stays consistent.

## Current app structure

- `src/App.jsx`: app state for language, theme, menu, and page layout.
- `src/components/index.js`: main component gateway for app-level imports.
- `src/components/layout/index.js`: layout component gateway.
- `src/components/profile/index.js`: profile component gateway.
- `src/components/ui/index.js`: UI/icon component gateway.
- `src/data/index.js`: data gateway.
- `src/data/portfolio.jsx`: bilingual portfolio copy and labels.
- `src/styles/global.css`: global layout, theme variables, navbar, profile, social, and footer styles.
- `docs/skills/design-governance.md`: design, grouping, component gateway, and anti AI slop rules.


## Design and structure rules

- Follow `docs/skills/design-governance.md` for UI, file grouping, component gateway, and anti AI slop rules.
- App-level component imports must come from `src/components/index.js`.
- New components must be placed in the correct group folder and exported through the group index plus the main component index.
- Keep data imports routed through `src/data/index.js`.
- Do not add comments, visible text, metadata, class names, docs, or asset names that credit or name outside reference websites/designs.

## Theme behavior

The theme switch should stay simple and smooth:

1. Add `transition` to `document.documentElement` before switching.
2. Set `data-theme` to `light` or `dark`.
3. Remove `transition` after the short transition window.
4. Store the chosen theme in `localStorage` under `theme`.
5. Keep the browser `theme-color` meta tag in sync.

## Language behavior

- Store language in `localStorage` under `portfolio-language`.
- Valid values are `id` and `en`.
- Update `document.documentElement.lang` after language changes.
- Keep navigation labels, subtitle, alt text, footer, and contact note tied to the selected language.

## Commands

```bash
npm install
npm run dev
npm run build
```

Use `npm run build` before handing off changes.

## Kejujuran kerja dan error handling

Pegang prinsip ini: lebih baik mendapatkan error keras yang jelas daripada kerusakan senyap yang diam-diam lolos. Jangan pernah mengaku pekerjaan sudah beres jika belum diverifikasi.

### Aturan wajib

- Jangan berbohong soal status pekerjaan. Jika belum selesai, bilang belum selesai.
- Jangan bilang build/test aman kalau belum menjalankan command yang relevan.
- Jangan menyembunyikan error hanya supaya layar terlihat tenang.
- Jangan mematikan warning, lint, test, validasi, atau logging hanya untuk meredam masalah.
- Jangan memakai fallback palsu yang membuat fitur terlihat berjalan padahal datanya rusak.
- Jangan menghapus fitur diam-diam untuk membuat error hilang.
- Jangan menelan error dengan `catch` kosong, `|| true`, return kosong, atau kondisi yang menutup masalah tanpa perbaikan akar.
- Jika harus membuat fallback, fallback harus eksplisit, aman, teruji, dan alasannya jelas.
- Error yang benar harus memberi sinyal yang bisa ditindaklanjuti.
- Perbaiki akar masalah, bukan gejalanya saja.

### Cara kerja saat ada error

1. Tulis command atau aksi yang memunculkan error.
2. Baca pesan error asli, jangan langsung ditebak.
3. Identifikasi akar masalah paling mungkin.
4. Buat perbaikan kecil dan terarah.
5. Jalankan ulang command yang gagal.
6. Jika berhasil, sebutkan command yang sudah lolos.
7. Jika belum berhasil, sebutkan status jujur dan sisa masalahnya.

### Larangan khusus

- Jangan menambah `try/catch` hanya untuk menyembunyikan crash.
- Jangan menambah `console.clear`, filter log, atau redirect output agar error tidak terlihat.
- Jangan men-disable aturan kualitas tanpa alasan kuat.
- Jangan mengganti test agar selalu hijau tanpa memperbaiki bug.
- Jangan membuat UI menampilkan state sukses jika data belum benar.
- Jangan meninggalkan bug dengan harapan tidak terlihat user.

### Standar laporan akhir

Saat menyelesaikan pekerjaan, jawab dengan jujur:

- Apa yang diubah.
- Apa yang sudah dites.
- Command apa yang berhasil.
- Jika ada yang belum dites, sebutkan jelas.
- Jika ada risiko atau sisa masalah, sebutkan jelas.

Prinsip akhirnya: keras di awal lebih baik daripada rusak diam-diam di belakang.

## Quality checklist

- Build succeeds.
- No console/runtime errors.
- Navbar controls are visible on desktop and mobile.
- Mobile menu opens and closes.
- Light/dark mode changes smoothly.
- ID/EN language toggle updates all bilingual text.
- No hidden or visible reference text to outside source websites/designs.
