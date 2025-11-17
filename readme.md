# Dokumentasi API (Frontend)

Dokumentasi ini merinci cara menggunakan API dari sisi frontend.

> **Base URL**: Seluruh endpoint menggunakan URL dasar: `http://localhost:5000`

---

## 🔐 Autentikasi

Sebagian besar endpoint pada API ini memerlukan autentikasi menggunakan **Bearer Token** (JWT).

**Alur Penggunaan:**

1.  Dapatkan `token` dari endpoint `POST /login`.
2.  Untuk setiap *request* ke endpoint yang terproteksi, sertakan token tersebut dalam **Authorization Header**.

**Contoh Header:**

Endpoint yang tidak memerlukan autentikasi ditandai sebagai **(Publik)**.

---

## Manajemen Pengguna (Autentikasi)

Endpoint yang berkaitan dengan registrasi, login, dan logout.

### Registrasi Pengguna (Publik)

Mendaftarkan pengguna baru ke dalam sistem.

* **Method**: `POST`
* **Endpoint**: `/register`
* **Body (JSON)**:
    ```json
    {
      "nama": "Nama Lengkap",
      "email": "user@example.com",
      "password": "password123",
      "role": "admin" 
    }
    ```
* **Success Response (201)**:
    ```json
    {
      "message": "Registrasi berhasil",
      "error": false,
    }
    ```
* **Error Response (500)**:
    ```json
    {
      "message": "Gagal registrasi",
      "error": true
    }
    ```

---

### Login Pengguna (Publik)

Melakukan login untuk mendapatkan token autentikasi.

* **Method**: `POST`
* **Endpoint**: `/login`
* **Body (JSON)**:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```
* **Success Response (200)**:
    > **PENTING**: Simpan `token`, `id`, dan `role` di sisi frontend untuk digunakan pada request selanjutnya.
    ```json
    {
      "message": "Login berhasil",
      "error": false,
      "data": {    
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "id": 1,
        "role": "admin",
        "nama": "Nama Lengkap"
      }
    }
    ```
* **Error Responses**:
    * **404**: `{ "message": "Email tidak ditemukan", "error": true}`
    * **401**: `{ "message": "Password salah", "error": true }`
    * **500**: `{ "message": "Terjadi kesalahan server", "error": true}`

---

### Logout Pengguna

Menghapus token pengguna dari database.

* **Method**: `DELETE`
* **Endpoint**: `/logout/{id}`
* **URL Params**:
    * `id` (Wajib): ID dari pengguna yang akan logout.
* **Autentikasi**: **(Publik)**
    > **Catatan**: Berdasarkan handler `logoutUser` yang diberikan, endpoint ini tidak memanggil `verifyToken`. Endpoint ini akan me-logout pengguna berdasarkan ID yang ada di URL.
* **Success Response (200)**:
    ```json
    {
      "message": "Logout berhasil",
      "error": false
    }
    ```
* **Error Response (500)**:
    ```json
    {
      "message": "Gagal logout",
      "error": true
    }
    ```

---

## Profil Pengguna

Endpoint untuk mengelola data profil pengguna.

### Mendapatkan Profil Pengguna by ID

Mengambil detail informasi seorang pengguna.

* **Method**: `GET`
* **Endpoint**: `/users/{id}`
* **Autentikasi**: **Memerlukan Autentikasi** (Bearer Token).
* **URL Params**:
    * `id` (Wajib): ID dari pengguna yang ingin dilihat.
* **Success Response (200)**:
    ```json
    {
      "message": "Profil berhasil diambil",
      "error": false,
      "data": {
        "id": 1,
        "nama": "Nama Lengkap",
        "email": "user@example.com",
        "role": "admin"
      }
    }
    ```
* **Error Responses**:
    * **401**: `{ "message": "Token tidak ditemukan", "error": true}`
    * **403**: `{ "message": "Token tidak valid atau sudah kedaluwarsa", "error": true}`
    * **404**: `{ "message": "Pengguna tidak ditemukan", "error": true}`
    * **500**: `{ "message": "Gagal mengambil profil pengguna", "error": true}`

---

### Memperbarui Profil Pengguna

Memperbarui nama, email, atau password pengguna.

* **Method**: `PUT`
* **Endpoint**: `/users/{id}`
* **Autentikasi**: **Memerlukan Autentikasi** (Bearer Token).
* **URL Params**:
    * `id` (Wajib): ID dari pengguna yang akan diperbarui.
* **Body (JSON)**:
    * `password` bersifat opsional. Jika tidak disertakan, password tidak akan diubah.
    ```json
    {
      "nama": "Nama Baru",
      "email": "emailbaru@example.com",
      "password": "passwordbaru123" 
    }
    ```
* **Success Response (200)**:
    ```json
    {
      "message": "Profil berhasil diperbarui",
      "error": false
    }
    ```
* **Error Responses**:
    * **401/403**: (Error terkait token)
    * **404**: `{ "message": "Pengguna tidak ditemukan", "error": true}`
    * **500**: `{ "message": "Gagal memperbarui profil pengguna", "error": true}`

---

### Memperbarui Role Pengguna (Khusus Admin)

Mengubah role seorang pengguna (misal: dari "user" menjadi "admin").

* **Method**: `PUT`
* **Endpoint**: `/users/{id}/role`
* **Autentikasi**: **Memerlukan Autentikasi Admin** (Bearer Token milik Admin).
* **URL Params**:
    * `id` (Wajib): ID dari pengguna yang rolenya akan diubah.
* **Body (JSON)**:
    ```json
    {
      "role": "admin"
    }
    ```
* **Success Response (200)**:
    ```json
    {
      "message": "Role pengguna berhasil diperbarui",
      "error": false
    }
    ```
* **Error Responses**:
    * **401/403**: (Error terkait token)
    * **403**: `{ "message": "Akses ditolak: hanya admin yang dapat mengakses ini" }`
    * **400**: `{ "message": "Field role tidak boleh kosong", "error": true}`
    * **404**: `{ "message": "Pengguna tidak ditemukan", "error": true}`
    * **500**: `{ "message": "Gagal memperbarui role pengguna", "error": true}`

---

### Menghapus Profil Pengguna

Menghapus akun pengguna dari database.

* **Method**: `DELETE`
* **Endpoint**: `/users/{id}`
* **Autentikasi**: **Memerlukan Autentikasi** (Bearer Token).
    > **Catatan**: Endpoint ini dilindungi oleh fungsi `verifyIsUser` (tidak disertakan dalam kode Anda), yang kemungkinan memvalidasi apakah pengguna yang login adalah pemilik akun atau seorang admin.
* **URL Params**:
    * `id` (Wajib): ID dari pengguna yang akan dihapus.
* **Success Response (200)**:
    ```json
    {
      "message": "Profil berhasil dihapus",
      "error": false
    }
    ```
* **Error Responses**:
    * **401/403**: (Error terkait token/otorisasi dari `verifyIsUser`)
    * **404**: `{ "message": "Pengguna tidak ditemukan", "error": true}`
    * **500**: `{ "message": "Gagal menghapus profil pengguna", "error": true}`

---

# Dokumentasi API: Password Reset

---

## Alur Reset Password

Fitur ini memerlukan dua langkah yang saling terhubung:

1.  **Meminta Reset (Forgot Password)**: Pengguna memasukkan email mereka. Frontend mengirim email ini ke `POST /forgot-password`. Backend kemudian mengirimkan email berisi link unik ke pengguna.
2.  **Melakukan Reset (Reset Password)**: Pengguna mengklik link di email mereka, yang akan mengarahkan mereka ke halaman reset password di aplikasi frontend Anda. Halaman ini harus:
    * Mengekstrak `token` dari URL query parameter.
    * Menampilkan form untuk "Password Baru".
    * Mengirim `token` (dari URL) dan `newPassword` (dari form) ke endpoint `POST /reset-password`.



### Catatan Penting untuk Frontend

Handler backend (`forgotPassword`) saat ini mengirimkan link yang mengarah ke backend itu sendiri:
`const resetLink = \`http://localhost:5000/reset-password?token=...\`;`

Agar alur ini berfungsi, **link ini harus diubah di backend** agar mengarah ke **halaman reset password di aplikasi frontend Anda**.

**Contoh (jika frontend Anda berjalan di `localhost:3000`):**
Link yang seharusnya dikirim oleh backend adalah:
`http://localhost:3000/halaman-reset-password?token=...`

Frontend Anda kemudian bertugas mengambil `token` dari URL tersebut saat halaman dimuat.

---

## Endpoints

### Meminta Link Reset Password

Memulai proses reset password dengan mengirimkan email yang berisi token ke pengguna.

* **Method**: `POST`
* **Endpoint**: `/forgot-password`
* **Autentikasi**: **(Publik)**
* **Body (JSON)**:
    ```json
    {
      "email": "user.terdaftar@example.com"
    }
    ```
* **Success Response (200)**:
    ```json
    {
      "message": "Email reset password telah dikirim",
      "error": false
    }
    ```
* **Error Responses**:
    * **404**: `{ "message": "Email tidak terdaftar", "error": true}`
    * **500**: `{ "message": "Gagal mengirim email reset password", "error": true}`

---

### Mengatur Password Baru

Mengatur password baru menggunakan token yang valid.

* **Method**: `POST`
* **Endpoint**: `/reset-password`
* **Autentikasi**: **(Publik)**
* **Body (JSON)**:
    > **Penting**: `token` didapat dari URL query parameter yang diterima pengguna di email.
    ```json
    {
      "token": "token_yang_didapat_dari_url",
      "newPassword": "password_baru_yang_kuat"
    }
    ```
* **Success Response (200)**:
    ```json
    {
      "message": "Password berhasil direset",
      "error": false
    }
    ```
* **Error Responses**:
    * **400**: `{ "message": "Token tidak valid atau telah kadaluarsa", "error": true }`
    * **404**: `{ "message": "Token tidak ditemukan", "error": true }`
    * **500**: `{ "message": "Gagal mereset password", "error": true}`

---

## Endpoint Data Tambang

### Mendapatkan Semua Data Tambang

Mengambil **seluruh** daftar data tambang yang ada di database.

* **Method**: `GET`
* **Endpoint**: `/mines`
* **Autentikasi**: Memerlukan Bearer Token.
* **Success Response (200)**:
    * Mengembalikan sebuah **array** dari objek data tambang.
    ```json
    {
      "message": "Data tambang berhasil diambil",
      "error": false,
      "data": 
          [
            {
              "mine_id": "MINE_1",
              "mine_name": "Tambang Adaro",
              "location": "Kalimantan Selatan",
              "region": "Kalsel",
              "start_date": "2005-10-10T00:00:00.000Z",
              "status": "Active",
              "remarks": "Pemasok utama"
            },
            {
              "mine_id": "MINE_2",
              "mine_name": "Tambang Kaltim Prima",
              "location": "Kalimantan Timur",
              "region": "Kaltim",
              "start_date": "1998-05-20T00:00:00.000Z",
              "status": "Active",
              "remarks": null
            }
          ]
  }
    ```
* **Error Response (500)**:
    ```json
    {
      "message": "Gagal mengambil data tambang",
      "error": true
    }
    ```

---

### Mendapatkan Data Tambang per ID

Mengambil data tambang **spesifik** berdasarkan `mine_id`.

* **Method**: `GET`
* **Endpoint**: `/mines/{id}`
* **Autentikasi**: Memerlukan Bearer Token.
* **URL Params**:
    * `id` (Wajib): ID unik dari tambang. (Contoh: `/mines/MINE_1`)
* **Success Response (200)**:
    * Mengembalikan sebuah **objek** tunggal dari data tambang.
    ```json
    {
      "message": "Data tambang berhasil diambil",
      "error": false,
      "data": 
          [
            {
              "mine_id": "MINE_1",
              "mine_name": "Tambang Adaro",
              "location": "Kalimantan Selatan",
              "region": "Kalsel",
              "start_date": "2005-10-10T00:00:00.000Z",
              "status": "Active",
              "remarks": "Pemasok utama"
            }
          ]
    }
    ```
* **Error Responses**:
    * **404 (Not Found)**:
        ```json
        {
          "message": "Data tambang tidak ditemukan",
          "error": true
        }
        ```
    * **500 (Server Error)**:
        ```json
        {
          "message": "Gagal mengambil data tambang",
          "error": true
        }
        ```
---

## Autentikasi & Otorisasi

Seluruh endpoint di bawah ini memerlukan **Autentikasi** (Bearer Token) dan **Otorisasi** khusus.

* **Autentikasi**: Anda harus menyertakan **Bearer Token** (JWT) yang didapat saat login dalam `Authorization` header pada setiap *request*.
    **Contoh Header:**
    ```
    Authorization: Bearer <token_yang_didapat_saat_login>
    ```
* **Otorisasi**: Token yang digunakan *harus* memiliki role yang valid (misalnya, 'Mine Planner'), sesuai dengan verifikasi `verifyMinePlanner` di backend.

**Kemungkinan Error Autentikasi/Otorisasi:**
* **401 (Unauthorized)**: `{ "message": "Token tidak ditemukan" }`
* **403 (Forbidden)**: `{ "message": "Token tidak valid..." }` atau `{ "message": "Akses ditolak..." }`

---

## Endpoint Inventaris Peralatan (Equipments)

Endpoint ini mengelola data dasar peralatan (CRUD - Create, Read, Update, Delete).

### Mendapatkan Semua Data Peralatan

Mengambil **seluruh** daftar peralatan dari inventaris.

* **Method**: `GET`
* **Endpoint**: `/equipments`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **Success Response (200)**:
    * Mengembalikan sebuah **array** dari objek peralatan.
    ```json
    {
      "message": "Data equipment berhasil diambil",
      "error": false,
      "data": [
        {
          "equipment_id": "EQ001",
          "mine_id": "MINE_1",
          "equipment_type": "Dump Truck",
          "brand": "Caterpillar",
          "model": "797F",
          "base_capacity_ton": 400,
          "last_maintenance": "2025-10-20T00:00:00.000Z",
          "operator_id": "OP005"
        },
        {
          "equipment_id": "EQ002",
          "mine_id": "MINE_2",
          "equipment_type": "Excavator",
          "brand": "Komatsu",
          "model": "PC2000-8",
          "base_capacity_ton": 120,
          "last_maintenance": "2025-11-01T00:00:00.000Z",
          "operator_id": "OP007"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    {
      "message": "Gagal mengambil data equipment",
      "error": true
    }
    ```

---

### Mendapatkan Data Peralatan per ID

Mengambil data peralatan **spesifik** berdasarkan `equipment_id`.

* **Method**: `GET`
* **Endpoint**: `/equipments/{id}`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **URL Params**:
    * `id` (Wajib): ID unik dari peralatan. (Contoh: `/equipments/EQ001`)
* **Success Response (200)**:
    * Mengembalikan sebuah **objek** tunggal dari data peralatan.
    ```json
    {
      "message": "Data equipment berhasil diambil",
      "error": false,
      "data": [
        {
          "equipment_id": "EQ001",
          "mine_id": "MINE_1",
          "equipment_type": "Dump Truck",
          "brand": "Caterpillar",
          "model": "797F",
          "base_capacity_ton": 400,
          "last_maintenance": "2025-10-20T00:00:00.000Z",
          "operator_id": "OP005"
        }
      ]
    }
    ```
* **Error Responses**:
    * **404 (Not Found)**:
        ```json
        {
          "message": "Equipment tidak ditemukan",
          "error": true
        }
        ```
    * **500 (Server Error)**:
        ```json
        {
          "message": "Gagal mengambil data equipment",
          "error": true
        }
        ```

---

### Menambahkan Peralatan Baru

Membuat entri peralatan baru di inventaris. ID Peralatan (`equipment_id`) akan dibuat secara otomatis oleh server.

* **Method**: `POST`
* **Endpoint**: `/equipments`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **Body (JSON)**:
    ```json
    {
      "mine_id": "MINE_1",
      "equipment_type": "Shovel",
      "brand": "P&H",
      "model": "4100XPC",
      "base_capacity_ton": 100,
      "last_maintenance": "2025-11-10",
      "operator_id": "OP010"
    }
    ```
* **Success Response (201)**:
    ```json
    {
      "message": "Equipment berhasil ditambahkan",
      "error": false,
      "data": [
        {
          "equipment_id": "EQ003"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    {
      "message": "Gagal menambahkan equipment",
      "error": true
    }
    ```

---

### Memperbarui Data Peralatan

Memperbarui data peralatan yang sudah ada berdasarkan `equipment_id`.

* **Method**: `PUT`
* **Endpoint**: `/equipments/{id}`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **URL Params**:
    * `id` (Wajib): ID unik dari peralatan yang akan diperbarui. (Contoh: `/equipments/EQ003`)
* **Body (JSON)**:
    * Kirim semua field, bahkan yang tidak berubah.
    ```json
    {
      "mine_id": "MINE_1",
      "equipment_type": "Shovel",
      "brand": "P&H",
      "model": "4100XPC-M",
      "base_capacity_ton": 105,
      "last_maintenance": "2025-11-10",
      "operator_id": "OP011"
    }
    ```
* **Success Response (200)**:
    ```json
    {
      "message": "Equipment berhasil diperbarui",
      "error": false
    }
    ```
* **Error Responses**:
    * **404 (Not Found)**:
        ```json
        {
          "message": "Equipment tidak ditemukan",
          "error": true
        }
        ```
    * **500 (Server Error)**:
        ```json
        {
          "message": "Gagal memperbarui equipment",
          "error": true
        }
        ```

---

## Kapasitas Efektif (Effective Capacity)

Endpoint untuk mengelola data kapasitas efektif peralatan.

### Mendapatkan Semua Data Kapasitas Efektif

* **Method**: `GET`
* **Endpoint**: `/effective-capacity`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **Success Response (200)**:
    * Mengembalikan sebuah **array** dari objek kapasitas efektif.
    ```json
    {
      "message": "Data effective capacity berhasil diambil",
      "error": false,
      "data": [
        {
          "effcap_id": "EFC0001",
          "mine_id": "MINE_1",
          "equipment_id": "EQ001",
          "week_start": "2025-11-10T00:00:00.000Z",
          "distance_km": 5.5,
          "road_condition": "Good",
          "weather_condition": "Clear",
          "availability_pct": 95.0,
          "effective_capacity_ton_day": 1500,
          "remark": "Operasi normal"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal mengambil data effective capacity", "error": true}
    ```

### Menambahkan Data Kapasitas Efektif

* **Method**: `POST`
* **Endpoint**: `/effective-capacity`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **Body (JSON)**:
    ```json
    {
      "mine_id": "MINE_1",
      "equipment_id": "EQ001",
      "week_start": "2025-11-17",
      "distance_km": 5.5,
      "road_condition": "Wet",
      "weather_condition": "Rain",
      "availability_pct": 90.0,
      "effective_capacity_ton_day": 1350,
      "remark": "Musim hujan"
    }
    ```
* **Success Response (201)**:
    ```json
    {
      "message": "Data effective capacity berhasil ditambahkan",
      "error": false,
      "data": [
        {
          "effcap_id": "EFC0002"
        }
      ]    
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal menambahkan data", "error": true}
    ```

### Memperbarui Data Kapasitas Efektif

* **Method**: `PUT`
* **Endpoint**: `/effective-capacity/{id}`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **URL Params**:
    * `id` (Wajib): ID dari data kapasitas efektif (Contoh: `EFC0002`).
* **Body (JSON)**:
    * Kirim semua field, bahkan yang tidak berubah.
    ```json
    {
      "mine_id": "MINE_1",
      "equipment_id": "EQ001",
      "week_start": "2025-11-17",
      "distance_km": 5.5,
      "road_condition": "Wet",
      "weather_condition": "Heavy Rain",
      "availability_pct": 85.0,
      "effective_capacity_ton_day": 1200,
      "remark": "Musim hujan lebat"
    }
    ```
* **Success Response (200)**:
    ```json
    { "message": "Data berhasil diperbarui", "error": false}
    ```
* **Error Responses**:
    * **404**: `{ "message": "Data tidak ditemukan", "error": true}`
    * **500**: `{ "message": "Gagal memperbarui data", "error": true}`

---

## Kendala Produksi (Production Constraints)

Endpoint untuk mengelola data kendala yang mempengaruhi produksi.

### Mendapatkan Semua Kendala Produksi

* **Method**: `GET`
* **Endpoint**: `/production-constraints`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **Success Response (200)**:
    * Mengembalikan sebuah **array** dari objek kendala produksi.
    ```json
    {
      "message": "Data production constraints berhasil diambil",
      "error": false,
      "data": [
        {
          "constraint_id": "C0001",
          "mine_id": "MINE_1",
          "equipment_id": "EQ001",
          "week_start": "2025-11-10T00:00:00.000Z",
          "constraint_type": "Maintenance",
          "capacity_value": 0,
          "unit": "Ton",
          "update_date": "2025-11-09T00:00:00.000Z",
          "remarks": "Perawatan preventif"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal mengambil data production constraints", "error": true}
    ```

### Menambahkan Kendala Produksi

* **Method**: `POST`
* **Endpoint**: `/production-constraints`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **Body (JSON)**:
    * `update_date` akan diisi otomatis oleh server.
    ```json
    {
      "mine_id": "MINE_1",
      "equipment_id": "EQ002",
      "week_start": "2025-11-17",
      "constraint_type": "Operational",
      "capacity_value": 500,
      "unit": "Ton/Day",
      "remarks": "Kekurangan operator"
    }
    ```
* **Success Response (201)**:
    ```json
    {
      "message": "Data production constraint berhasil ditambahkan",
      "error": false,
      "data": [
        {
          "constraint_id": "C0002"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal menambahkan data production constraint", "error": true}
    ```

---

## Rencana Produksi (Production Plans)

Endpoint untuk mengelola rencana produksi mingguan.

### Mendapatkan Semua Rencana Produksi

* **Method**: `GET`
* **Endpoint**: `/production-plans`
* **Autentikasi**: **Memerlukan Token (Role Apapun)**.
* **Success Response (200)**:
    * Mengembalikan sebuah **array** dari objek rencana produksi.
    ```json
    {
      "message": "Data production plans berhasil diambil",
      "error": false,
      "data": [
        {
          "plan_id": "PLAN0001",
          "mine_id": "MINE_1",
          "week_start": "2025-11-10T00:00:00.000Z",
          "planned_output_ton": 10000,
          "actual_output_ton": 9500,
          "target_variance_pct": -5.0,
          "status": "Completed",
          "updated_by": "planner_user_id"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal mengambil data production plans", "error": true}
    ```

### Menambahkan Rencana Produksi

* **Method**: `POST`
* **Endpoint**: `/production-plans`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **Body (JSON)**:
    ```json
    {
      "mine_id": "MINE_1",
      "week_start": "2025-11-17",
      "planned_output_ton": 12000,
      "actual_output_ton": 0,
      "target_variance_pct": 0,
      "status": "Pending",
      "updated_by": "planner_user_id_002"
    }
    ```
* **Success Response (201)**:
    ```json
    {
      "message": "Data production plan berhasil ditambahkan",
      "error": false,
      "data": [
        {
          "plan_id": "PLAN0002"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal menambahkan data production plan", "error": true}
    ```

### Memperbarui Rencana Produksi

* **Method**: `PUT`
* **Endpoint**: `/production-plans/{id}`
* **Autentikasi**: Memerlukan Token (Role: Mine Planner).
* **URL Params**:
    * `id` (Wajib): ID dari rencana produksi (Contoh: `PLAN0002`).
* **Body (JSON)**:
    * Sering digunakan untuk memperbarui `actual_output_ton` dan `status`.
    ```json
    {
      "mine_id": "MINE_1",
      "week_start": "2025-11-17",
      "planned_output_ton": 12000,
      "actual_output_ton": 11500,
      "target_variance_pct": -4.17,
      "status": "In Progress",
      "updated_by": "planner_user_id_002"
    }
    ```
* **Success Response (200)**:
    ```json
    { "message": "Data berhasil diperbarui", "error": false}
    ```
* **Error Responses**:
    * **404**: `{ "message": "Data tidak ditemukan", "error": true}`
    * **500**: `{ "message": "Gagal memperbarui data", "error": true}`

---

## Data Cuaca (Weather)

Endpoint untuk mengambil data cuaca.

### Mendapatkan Semua Data Cuaca

* **Method**: `GET`
* **Endpoint**: `/weather`
* **Autentikasi**: Memerlukan Token (Role Apapun).
* **Success Response (200)**:
    * Mengembalikan sebuah **array** dari objek data cuaca.
    ```json
    {
      "message": "Data cuaca berhasil diambil",
      "error": false,
      "data": [
        {
          "weather_id": "W0001",
          "mine_id": "MINE_1",
          "date": "2025-11-10T00:00:00.000Z",
          "condition": "Rainy",
          "temperature_c": 24.5,
          "rainfall_mm": 15.2,
          "wind_speed_kph": 10
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal mengambil data cuaca", "error": true}
    ```

---

## Kondisi Jalan (Roads)

Endpoint untuk mengelola data kondisi jalan.

### Mendapatkan Semua Kondisi Jalan

* **Method**: `GET`
* **Endpoint**: `/roads`
* **Autentikasi**: Memerlukan Token (Role Apapun).
* **Success Response (200)**:
    * Mengembalikan sebuah **array** dari objek kondisi jalan.
    ```json
    {
      "message": "Data kondisi jalan berhasil diambil",
      "error": false,
      "data": [
        {
          "road_id": "RD001",
          "mine_id": "M001",
          "segment_name": "Hauling Road A",
          "condition_level": "Poor",
          "accessibility_pct": 60.0,
          "last_inspection": "2025-11-09T00:00:00.000Z",
          "remark": "Berlubang setelah hujan"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal mengambil data kondisi jalan", "error": true}
    ```

### Memperbarui Kondisi Jalan

* **Method**: `PUT`
* **Endpoint**: `/roads/{id}`
* **Autentikasi**: Memerlukan Token (Role: **Mine Planner**).
* **URL Params**:
    * `id` (Wajib): ID dari segmen jalan (Contoh: `RD001`).
* **Body (JSON)**:
    ```json
    {
      "mine_id": "MINE_1",
      "segment_name": "Hauling Road A",
      "condition_level": "Fair",
      "accessibility_pct": 85.0,
      "last_inspection": "2025-11-10",
      "remark": "Sudah diperbaiki"
    }
    ```
* **Success Response (200)**:
    ```json
    { "message": "Data berhasil diperbarui", "error": false}
    ```
* **Error Responses**:
    * **404**: `{ "message": "Data tidak ditemukan", "error": true}`
    * **500**: `{ "message": "Gagal memperbarui data", "error": true}`

---

## Jadwal Pengiriman (Shipping Schedules)

Endpoint untuk mengelola jadwal pengiriman. Semua endpoint di bagian ini memerlukan role **Shipping Planner**.

### Mendapatkan Semua Jadwal Pengiriman

* **Method**: `GET`
* **Endpoint**: `/shipping-schedules`
* **Autentikasi**: Memerlukan Token (Role: **Shipping Planner**).
* **Success Response (200)**:
    * Mengembalikan sebuah **array** dari objek jadwal.
    ```json
    {
      "message": "Data jadwal pengiriman berhasil diambil",
      "error": false,
      "data":[
        {
          "shipment_id": "SHP0001",
          "mine_id": "MINE_1",
          "week_start": "2025-11-10T00:00:00.000Z",
          "vessel_name": "MV Sejahtera",
          "destination_port": "Port Tokyo",
          "coal_tonnage": 50000,
          "etd": "2025-11-12T00:00:00.000Z",
          "eta": "2025-11-20T00:00:00.000Z",
          "status": "Scheduled"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal mengambil data jadwal pengiriman", "error": true}
    ```

### Mendapatkan Jadwal Pengiriman per ID

* **Method**: `GET`
* **Endpoint**: `/shipping-schedules/{id}`
* **Autentikasi**: Memerlukan Token (Role: **Shipping Planner**).
* **URL Params**:
    * `id` (Wajib): ID dari jadwal pengiriman (Contoh: `SHP0001`).
* **Success Response (200)**:
    * Mengembalikan sebuah **objek** tunggal.
    ```json
    {
      "message": "Data jadwal pengiriman berhasil diambil",
      "error": false,
      "data": [
        {
          "shipment_id": "SHP0001",
          "mine_id": "MINE_1",
          "week_start": "2025-11-10T00:00:00.000Z",
          "vessel_name": "MV Sejahtera",
          "destination_port": "Port Tokyo",
          "coal_tonnage": 50000,
          "etd": "2025-11-12T00:00:00.000Z",
          "eta": "2025-11-20T00:00:00.000Z",
          "status": "Scheduled"
        }
      ]
    }
    ```
* **Error Responses**:
    * **404**: `{ "message": "Data tidak ditemukan", "error": true}`
    * **500**: `{ "message": "Gagal mengambil data jadwal pengiriman", "error": true}`

### Menambahkan Jadwal Pengiriman

* **Method**: `POST`
* **Endpoint**: `/shipping-schedules`
* **Autentikasi**: Memerlukan Token (Role: **Shipping Planner**).
* **Body (JSON)**:
    ```json
    {
      "mine_id": "MINE_2",
      "week_start": "2025-11-17",
      "vessel_name": "MV Berkah",
      "destination_port": "Port Shanghai",
      "coal_tonnage": 75000,
      "etd": "2025-11-18",
      "eta": "2025-11-25",
      "status": "Pending"
    }
    ```
* **Success Response (201)**:
    ```json
    {
      "message": "Jadwal pengiriman berhasil dibuat",
      "error": false,
      "data": [
        {
          "shipment_id": "SHP0002"
        }
      ]
    }
    ```
* **Error Response (500)**:
    ```json
    { "message": "Gagal membuat jadwal pengiriman", "error": true}
    ```

### Memperbarui Jadwal Pengiriman

* **Method**: `PUT`
* **Endpoint**: `/shipping-schedules/{id}`
* **Autentikasi**: Memerlukan Token (Role: **Shipping Planner**).
* **URL Params**:
    * `id` (Wajib): ID dari jadwal yang akan diperbarui (Contoh: `SHP0002`).
* **Body (JSON)**:
    ```json
    {
      "mine_id": "MINE_2",
      "week_start": "2025-11-17",
      "vessel_name": "MV Berkah",
      "destination_port": "Port Shanghai",
      "coal_tonnage": 75000,
      "etd": "2025-11-19",
      "eta": "2025-11-26",
      "status": "Confirmed"
    }

    ```
* **Success Response (200)**:
    ```json
    { "message": "Data berhasil diperbarui", "error": false}
    ```
* **Error Responses**:
    * **404**: `{ "message": "Data tidak ditemukan", "error": true }`
    * **500**: `{ "message": "Gagal memperbarui data", "error": true}`