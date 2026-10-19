# M-Ber (Monthly Budget Report) - Dompet Pintar Cimahi

Aplikasi manajemen keuangan bulanan modern, *offline-first*, dan presisi untuk warga Kota Cimahi & Kabupaten Bandung Barat (KBB). Dilengkapi fitur reset otomatis setiap tanggal 1, kalkulator *daily limit*, sinkronisasi Google Sheets, onboarding pertama untuk pemasukan bulanan, dan asisten Kang Tambal AI.

- **GitHub Repository**: [https://github.com/soKrizpy/m-ber](https://github.com/soKrizpy/m-ber)
- **Live Vercel Production**: [https://m-ber.vercel.app](https://m-ber.vercel.app)

---

## 🚀 Perintah Update & Push ke GitHub

Kode lokal Anda sudah berada di branch `main` dan sejajar dengan repository `soKrizpy/m-ber`. Untuk mem-push pembaruan file konfigurasi Vercel (`vercel.json`), serverless function (`api/index.ts`), dan panduan ke GitHub:

```bash
# Push pembaruan ke GitHub (akan memicu auto-deploy di Vercel secara otomatis)
git push origin main
```

---

## 🌐 Konfigurasi Vercel (`https://m-ber.vercel.app`)

Proyek ini telah dikonfigurasi secara lengkap untuk Vercel:
- **`vercel.json`**: Menangani routing SPA (agar reload halaman tidak 404) dan meneruskan panggilan `/api/*` ke serverless function.
- **`api/index.ts`**: Menyediakan serverless API untuk fitur AI Kang Tambal (`/api/gemini/advisor`, `/api/gemini/chat`, `/api/gemini/daily-tips`, `/api/gemini/smart-shopping-list`).

### Pengaturan Environment Variables di Vercel:
1. Masuk ke [Vercel Dashboard](https://vercel.com) -> pilih project **m-ber**.
2. Masuk ke tab **Settings** -> **Environment Variables**.
3. Tambahkan:
   - `GEMINI_API_KEY`: *(Masukkan Gemini API Key Anda untuk mengaktifkan asisten AI Kang Tambal secara online)*

---

## 🔑 Langkah Penting: Izinkan Domain Vercel di Firebase Auth (Google Sign-In)

Agar pengunjung dan pengguna lain dapat melakukan **Login Google & Sinkronisasi Google Sheets** di `https://m-ber.vercel.app/` tanpa error `auth/unauthorized-domain`:

1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih project Firebase aplikasi (`gen-lang-client-0025417287`).
3. Masuk ke menu **Authentication** di panel sebelah kiri.
4. Klik tab **Settings**, lalu pilih submenu **Authorized domains**.
5. Klik tombol **Add domain**.
6. Masukkan: `m-ber.vercel.app`.
7. Klik **Done / Save**.

---

## 👥 Akses Publik & Mode Offline-First (Tanpa Login)

Aplikasi **M-Ber** dirancang dengan prinsip **Offline-First**:
- **Siapapun orang lain** yang mengakses `https://m-ber.vercel.app` dapat langsung memakai aplikasi secara gratis dan mandiri.
- Pada saat pertama kali membuka, muncul pop-up onboarding untuk mengisi nominal uang bulanan.
- Jika pengguna memilih **"Lewati Form Ini"**, seluruh fitur (kalkulator limit harian, pencatatan transaksi, target tabungan, dan ekspor PDF) tetap berfungsi 100% menggunakan penyimpanan lokal perangkat (*IndexedDB/LocalStorage*).

---

## 🛠️ Perintah Lokal

```bash
# Menjalankan server pengembangan lokal (Port 3000)
npm run dev

# Uji build produksi
npm run build

# Pengecekan tipe data
npm run lint
```
