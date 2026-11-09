# Fondasi CS

Website belajar mandiri berbahasa Indonesia untuk menyiapkan fondasi **Master of Computer Science (MECS), Universiti Teknologi Malaysia**, intake Februari 2028.

## Enam jalur belajar

| No | Jalur | Modul | Status |
|----|-------|-------|--------|
| 1 | Teori Komputasi | 12 | Modul 1–2 siap (DFA & NFA, simulator 3D + konstruksi subset) |
| 2 | Kecerdasan Buatan Klasik | 12 | Garis besar |
| 3 | Algoritma Lanjut | 12 | Garis besar |
| 4 | Matematika Diskrit | 10 | Modul 1–3 siap (logika + kubus kebenaran 3D, pembuktian, induksi + domino 3D) |
| 5 | Riset dan Menulis Ilmiah (Inggris) | 10 | Garis besar |
| 6 | Python dan ML Praktis | 11 | Modul 0 siap (Matematika untuk ML, gradient descent 3D) |

## Fitur

- Animasi 3D interaktif dengan Three.js (diputar, di-zoom, dijalankan langkah demi langkah).
- Simulator DFA dengan editor: tulis DFA sendiri, editor memeriksa kelengkapan dan determinisme.
- Latihan dengan pembahasan tersembunyi, kuis dengan penjelasan, dan glosarium Inggris–Indonesia.
- Progres belajar tersimpan di browser (localStorage).
- Tema terang/gelap, responsif di HP, menghormati `prefers-reduced-motion`, fallback bila WebGL tidak ada.

## Menjalankan secara lokal

Situs ini statis, tanpa proses build. Karena memakai ES modules, buka lewat server lokal:

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

## Struktur

```
index.html                 beranda + peta 3D
roadmap.html?jalur=<id>    roadmap per jalur (dirender dari data)
teori-komputasi/           halaman modul
assets/js/data/tracks.js   seluruh data jalur & modul (edit di sini untuk menambah modul)
assets/js/viz/             visualisasi 3D (automata, peta beranda)
assets/js/components/      simulator DFA, kuis
assets/vendor/three/       Three.js r160 (MIT), disertakan agar tidak bergantung CDN
```

## Menambah modul baru

1. Salin `teori-komputasi/01-bahasa-dan-dfa.html` sebagai template.
2. Di `assets/js/data/tracks.js`, ubah `status` modul menjadi `"ready"` dan isi `href`.

## Rujukan utama

Sipser, *Introduction to the Theory of Computation*; Russell & Norvig, *AIMA*; Cormen dkk., *CLRS*; MIT OpenCourseWare 18.404J, 6.042J, 6.046J.
