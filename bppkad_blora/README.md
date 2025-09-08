# Website BPPKAD Blora - Realisasi APBD 2017-2024

Website untuk menampilkan data realisasi APBD (Anggaran Pendapatan dan Belanja Daerah) Kabupaten Blora dengan visualisasi grafik interaktif.

## 🚀 Fitur Utama

- **Dashboard Interaktif**: Grafik perbandingan realisasi APBD per tahun
- **3 Kategori Utama**: Pendapatan, Pembelanjaan, dan Pembiayaan  
- **Grafik Responsif**: Menggunakan Chart.js untuk visualisasi data
- **Admin Panel**: Input, edit, dan hapus data APBD
- **Database Integration**: Koneksi ke Supabase untuk penyimpanan data
- **Responsive Design**: Tampilan optimal di desktop dan mobile

## 📁 Struktur Project

```
bppkad-blora/
├── index.html          # Halaman utama
├── css/
│   └── style.css      # File styling
├── js/
│   └── script.js      # File JavaScript
└── README.md          # Dokumentasi
```

## 🔧 Setup dan Instalasi

### 1. Clone atau Download Project
```bash
git clone [URL_REPOSITORY]
cd bppkad-blora
```

### 2. Setup Supabase Database

#### A. Buat Akun Supabase
1. Kunjungi [https://supabase.com](https://supabase.com)
2. Daftar akun baru atau login
3. Buat project baru

#### B. Buat Tabel Database
Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Membuat tabel apbd_data
CREATE TABLE apbd_data (
    id SERIAL PRIMARY KEY,
    tahun INTEGER NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    subkategori VARCHAR(200) NOT NULL,
    nilai BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menambahkan RLS (Row Level Security)
ALTER TABLE apbd_data ENABLE ROW LEVEL SECURITY;

-- Policy untuk select (semua orang bisa baca)
CREATE POLICY "Enable read access for all users" ON apbd_data
    FOR SELECT USING (true);

-- Policy untuk insert (semua orang bisa input)
CREATE POLICY "Enable insert for all users" ON apbd_data
    FOR INSERT WITH CHECK (true);

-- Policy untuk delete (semua orang bisa hapus)
CREATE POLICY "Enable delete for all users" ON apbd_data
    FOR DELETE USING (true);

-- Insert sample data
INSERT INTO apbd_data (tahun, kategori, subkategori, nilai) VALUES
(2017, 'Pendapatan', 'Pajak Daerah', 50000000000),
(2017, 'Pendapatan', 'Retribusi Daerah', 25000000000),
(2017, 'Pembelanjaan', 'Belanja Pegawai', 80000000000),
(2018, 'Pendapatan', 'Pajak Daerah', 55000000000),
(2018, 'Pembelanjaan', 'Belanja Pegawai', 85000000000);
```

#### C. Konfigurasi API Keys
1. Di dashboard Supabase, buka **Settings** > **API**
2. Copy **URL** dan **anon public** key
3. Edit file `js/script.js`, ganti:
```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-anon-public-key-here';
```

### 3. Deploy ke GitHub Pages

#### A. Upload ke GitHub Repository
1. Buat repository baru di GitHub
2. Upload semua file project
3. Pastikan file `index.html` ada di root directory

#### B. Aktifkan GitHub Pages
1. Di repository, buka **Settings**
2. Scroll ke bagian **Pages**
3. Di **Source**, pilih **Deploy from a branch**
4. Pilih branch **main** dan folder **/ (root)**
5. Klik **Save**

#### C. Akses Website
- Website akan tersedia di: `https://username.github.io/repository-name`
- Tunggu beberapa menit untuk deployment

## 📱 Cara Penggunaan

### Mode User (Default)
- Lihat dashboard dan grafik realisasi APBD
- Navigasi antar kategori: Pendapatan, Pembelanjaan, Pembiayaan
- Lihat detail data dalam bentuk tabel

### Mode Admin
1. Klik tombol **"Admin Mode"** di kanan atas
2. Panel admin akan muncul di dashboard
3. **Input Data Baru**:
   - Pilih tahun (2017-2024)
   - Pilih kategori 
   - Ketik subkategori manual
   - Input nilai dalam rupiah
   - Klik **"Simpan Data"**
4. **Hapus Data**: Klik tombol **"Hapus"** di tabel (hanya tampil di mode admin)

## 🎨 Kustomisasi

### Mengganti Warna Tema
Edit file `css/style.css`, ubah variabel warna:
```css
/* Primary Colors */
--primary-blue: #3498db;
--primary-dark: #2c3e50;
--secondary-gray: #34495e;
```

### Menambah Tahun
Edit file `js/script.js`, tambahkan tahun di form:
```html
<option value="2025">2025</option>
```

### Mengganti Logo/Header
Edit bagian header di `index.html`:
```html
<div class="logo">BLORA</div>
<h1>BPPKAD Kabupaten Blora</h1>
```

## 🔒 Keamanan Database

Website ini menggunakan Supabase dengan Row Level Security (RLS):
- **Public Read**: Semua orang bisa melihat data
- **Public Insert/Delete**: Hanya untuk demo, di production sebaiknya dibatasi
- Untuk production, buat authentication dan role-based access

## 🐛 Troubleshooting

### Error "Supabase not configured"
- Pastikan SUPABASE_URL dan SUPABASE_KEY sudah diisi dengan benar
- Cek koneksi internet dan validity API key

### Grafik tidak muncul
- Pastikan Chart.js berhasil dimuat (cek Console browser)
- Pastikan ada data di database untuk kategori yang dipilih

### Data tidak tersimpan
- Cek Console browser untuk error message
- Pastikan tabel `apbd_data` sudah dibuat di Supabase
- Pastikan RLS policies sudah diterapkan

## 📞 Support

Untuk bantuan teknis:
1. Cek Console browser (F12) untuk error message
2. Pastikan semua file sudah diupload dengan benar
3. Verify konfigurasi Supabase

## 📄 License

Project ini dibuat untuk keperluan internal BPPKAD Kabupaten Blora.