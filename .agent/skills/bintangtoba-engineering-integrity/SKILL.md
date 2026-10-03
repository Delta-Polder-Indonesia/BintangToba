---
name: bintangtoba-engineering-integrity
description: Enforce engineering integrity with visible errors, clear verification, and honest status reports.
metadata:
  project: BintangToba
  principle: honest engineering
---

# Engineering Integrity Skill

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

## Kapan skill ini dipakai

Gunakan skill ini untuk semua pekerjaan coding, debugging, refactor, build, styling, deploy, dan review. Skill ini wajib dipakai terutama saat ada error, warning, test gagal, bug aneh, atau permintaan yang menyentuh kualitas sistem.

## Definition of done

Pekerjaan baru boleh disebut selesai jika:

- perubahan sudah dibuat sesuai permintaan,
- command verifikasi yang relevan sudah dijalankan,
- hasil command disebutkan dengan jujur,
- tidak ada error yang disembunyikan,
- tidak ada fitur yang dihapus diam-diam,
- jika masih ada kekurangan, kekurangan itu disebutkan jelas.
