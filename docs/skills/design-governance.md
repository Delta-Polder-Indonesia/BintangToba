---
name: bintangtoba-design
description: Design, structure, component gateway, file grouping, and anti AI slop rules for the BintangToba portfolio.
metadata:
  project: BintangToba
  stack: React, Vite, CSS
  owner: Bintang Toba
---

# BintangToba Design Skill

## Tujuan

Gunakan skill ini setiap kali mengubah tampilan, struktur folder, komponen, copywriting, atau interaksi di portfolio BintangToba. Targetnya adalah hasil yang rapi, personal, mudah dirawat, dan tidak terasa seperti buatan instan.

## Prinsip utama

- Identitas utama selalu Bintang Toba.
- Desain harus minimal, tenang, akademik, dan personal.
- Jangan menambah teks, komentar, nama class, metadata, atau catatan yang menyebut sumber desain luar.
- Jangan menambah efek visual tanpa fungsi yang jelas.
- Jangan mengubah paragraf bio dan foto profil kecuali user meminta.
- Tombol bahasa dan tombol tema wajib tetap terlihat.
- Setiap perubahan harus lolos build.

## Komponen wajib satu pintu

Semua komponen yang dipakai dari luar folder `src/components` harus lewat pintu utama:

```js
import { Footer, Header, ProfileCard, SocialLinks } from './components/index.js';
```

Aturan export:

- Komponen layout diekspor dari `src/components/layout/index.js`.
- Komponen profil diekspor dari `src/components/profile/index.js`.
- Komponen UI kecil diekspor dari `src/components/ui/index.js`.
- Semua export publik digabung di `src/components/index.js`.
- Jangan deep import komponen dari `src/App.jsx` seperti `./components/layout/Header.jsx`.
- Jika membuat komponen baru, langsung tambahkan export di index kelompok dan index utama.

## File harus berkelompok

Struktur folder yang harus dipertahankan:

```text
src/
  assets/
    images/
  components/
    layout/
    profile/
    ui/
    index.js
  data/
    index.js
    portfolio.jsx
  styles/
    global.css
  App.jsx
  main.jsx
```

Aturan pengelompokan:

- `layout`: header, footer, navigasi, shell halaman.
- `profile`: foto, bio, social/contact area.
- `ui`: icon, helper UI kecil, elemen reusable yang tidak punya domain khusus.
- `data`: konten bilingual, label, link, metadata konten.
- `styles`: style global, design tokens, responsive rules.
- `assets/images`: gambar, bendera, foto, favicon.
- Jangan menaruh file baru langsung di `src/components` kecuali `index.js`.
- Satu file komponen untuk satu tanggung jawab utama.
- Jangan membuat folder baru jika nama folder yang ada sudah cukup.

## Aturan desain

- Gunakan CSS variables untuk warna, border, teks, background, footer, dan mode gelap/terang.
- Perubahan warna harus dicek di light dan dark mode.
- Pertahankan lebar konten utama sekitar 800px.
- Pertahankan foto profil float kanan di desktop dan full width di mobile.
- Typography harus sederhana, mudah dibaca, dan tidak ramai.
- Link harus jelas terlihat dan punya hover state.
- Animasi hanya untuk transisi tema, menu mobile, dan hover kecil.
- Jangan menambah background ramai, glow, shadow besar, atau dekorasi yang tidak punya alasan.

## Aturan theme

- Theme disimpan di `localStorage` key `theme`.
- Nilai valid hanya `light` atau `dark`.
- Set theme lewat `document.documentElement.setAttribute('data-theme', theme)`.
- Saat toggle, tambah class `transition`, ubah theme, lalu hapus class setelah durasi pendek.
- Update meta `theme-color` saat theme berubah.
- Tombol tema harus punya `aria-pressed`.

## Aturan bahasa

- Bahasa disimpan di `localStorage` key `portfolio-language`.
- Nilai valid hanya `id` atau `en`.
- Update `document.documentElement.lang` saat bahasa berubah.
- Tombol bahasa harus menampilkan kode bahasa dan bendera.
- Semua label yang terlihat user harus dari `portfolioContent`.
- Jangan hardcode copy bilingual di komponen jika sudah tersedia di data.

## Anti AI slop

Sebelum menulis kode, cek hal ini:

- Jangan menambah section palsu hanya agar halaman terlihat penuh.
- Jangan menulis copy generik seperti promosi kosong, klaim berlebihan, atau buzzword tanpa konteks.
- Jangan menambah animasi yang membuat halaman terasa murahan.
- Jangan membuat komponen besar yang isinya campur aduk.
- Jangan membuat class CSS duplikat untuk style yang sama.
- Jangan menambah library hanya untuk hal yang bisa dibuat dengan CSS/React sederhana.
- Jangan mengubah desain hanya karena terlihat lebih ramai.
- Jangan memakai warna acak di luar token yang sudah ada.
- Jangan menambah komentar yang menjelaskan hal jelas.
- Jangan meninggalkan file mati, import tidak dipakai, atau export tidak dipakai.

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

## Checklist sebelum selesai

- `npm run build` berhasil.
- Tidak ada import komponen langsung dari subfolder ke `App.jsx`.
- Komponen baru sudah masuk index kelompok dan `src/components/index.js`.
- File baru berada di folder yang sesuai.
- Tombol ID/EN terlihat dan berfungsi.
- Tombol light/dark terlihat dan berfungsi.
- Mobile menu tetap bisa dibuka/tutup.
- Light dan dark mode sama-sama enak dibaca.
- Tidak ada teks rujukan sumber desain luar di kode, docs, metadata, atau komentar.
- Hasil akhir terlihat personal, bukan hasil asal jadi.
