============================================================
DAFTAR FITUR - IMMUNIZATION MODULE
Base URL:
  /immunizations
============================================================

Catatan umum:
  - Dokter/Admin = bisa CREATE, UPDATE, DELETE
  - Pasien = hanya bisa READ (read-only)
  - Soft delete = mengisi kolom deleted_at

1) Tambah Data Imunisasi
   - Akses: POST /immunizations
   - Akses Role: Dokter & Admin
   - Body: pasien_id, doctor_id, nama_vaksin,
           jenis_vaksin, dosis_ke, tanggal_vaksin,
           lokasi, catatan (opsional),
           tanggal_berikutnya (opsional)
   - Tujuan: input data vaksinasi pasien

2) Get List Imunisasi (by Pasien)
   - Akses: GET /immunizations/pasien/:pasien_id
   - Akses Role: Pasien & Dokter
   - Query: jenis_vaksin, date_from, 
            date_to, limit, offset
   - Tujuan: pasien lihat riwayat vaksinnya

3) Get Detail Imunisasi
   - Akses: GET /immunizations/:id
   - Akses Role: Pasien & Dokter
   - Tujuan: lihat detail 1 data imunisasi

4) Update Data Imunisasi
   - Akses: PATCH /immunizations/:id
   - Akses Role: Dokter & Admin
   - Tujuan: edit data imunisasi yang sudah diinput

5) Hapus Data Imunisasi (Soft Delete)
   - Akses: DELETE /immunizations/:id
   - Akses Role: Dokter & Admin
   - Tujuan: hapus data imunisasi