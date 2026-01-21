# 🌾 BLUEPRINT LOGIKA SISTEM PAKAR DIAGNOSIS PENYAKIT PADI v2.0
## METODE: HYBRID FORWARD CHAINING + CERTAINTY FACTOR + AI INTEGRATION

**Dokumen ini adalah blueprint lengkap untuk memperbaiki kesalahan logika pada sistem pakar v1.0**

---

## 📋 TABLE OF CONTENTS

1. [PENDAHULUAN & KESALAHAN LOGIKA v1.0](#1-pendahuluan--kesalahan-logika-v10)
2. [STRUKTUR DATA & DATABASE](#2-struktur-data--database)
3. [LOGIKA SISTEM YANG BENAR](#3-logika-sistem-yang-benar)
4. [ALGORITMA FORWARD CHAINING](#4-algoritma-forward-chaining)
5. [ALGORITMA CERTAINTY FACTOR](#5-algoritma-certainty-factor)
6. [HANDLING KASUS KHUSUS](#6-handling-kasus-khusus)
7. [AI INTEGRATION](#7-ai-integration)
8. [IMPLEMENTASI KODE](#8-implementasi-kode)
9. [VALIDASI & TESTING](#9-validasi--testing)
10. [DEPLOYMENT CHECKLIST](#10-deployment-checklist)

---

## 1. PENDAHULUAN & KESALAHAN LOGIKA v1.0

### 1.1 Identifikasi Kesalahan pada Sistem Lama

**❌ MASALAH UTAMA:**

1. **Forward Chaining Terlalu Kaku**
   - Sistem hanya mencari "exact match" atau kecocokan sempurna
   - Tidak bisa menangani input gejala acak dari penyakit berbeda
   - Hanya mengembalikan 1 penyakit, padahal bisa multiple disease

2. **Perhitungan CF Tidak Paralel**
   - CF hanya dihitung untuk 1 penyakit yang ditemukan pertama
   - Tidak menghitung semua penyakit yang gejalanya dipilih user
   - Kombinasi CF tidak akumulatif

3. **Tidak Ada Validasi Minimum Gejala**
   - User bisa input hanya 1-2 gejala
   - Diagnosis jadi tidak akurat

4. **Threshold dan Penalti Tidak Ada**
   - Tidak ada penalti untuk penyakit dengan hanya 1 gejala
   - Tidak ada threshold untuk menentukan diagnosis valid atau tidak

### 1.2 Solusi yang Akan Diterapkan

**✅ PERBAIKAN:**

1. **Forward Chaining Paralel**: Semua penyakit yang gejalanya cocok akan dihitung
2. **CF Akumulatif per Penyakit**: Setiap penyakit dihitung CF-nya secara independen
3. **Validasi Input**: Minimal 3 gejala wajib dipilih
4. **Sistem Penalti**: Penyakit dengan sedikit gejala cocok akan diberi penalti
5. **Threshold Diagnosis**: Hanya penyakit dengan CF ≥ threshold yang ditampilkan

---

## 2. STRUKTUR DATA & DATABASE

### 2.1 Referensi Database (pakar_padi.db)

Berdasarkan struktur yang sudah ada di repository GitHub:

```
backend/
└── instance/
    └── pakar_padi.db
```

**Tabel Utama:**

1. **`diseases`** (Penyakit)
   - `id` INT PRIMARY KEY
   - `kode_p` VARCHAR(10) UNIQUE (P01-P07)
   - `name` VARCHAR(255)
   - `description` TEXT
   - `solution_basic` TEXT

2. **`symptoms`** (Gejala)
   - `id` INT PRIMARY KEY
   - `kode_g` VARCHAR(10) UNIQUE (G01-G034)
   - `name` VARCHAR(255)
   - `category` VARCHAR(50) (Daun, Batang, Malai, Gabah)

3. **`rules`** (Basis Aturan)
   - `id` INT PRIMARY KEY
   - `disease_id` INT FOREIGN KEY → diseases(id)
   - `symptom_id` INT FOREIGN KEY → symptoms(id)
   - `mb` DECIMAL(3,2) (Measure of Belief: 0.00-1.00)
   - `md` DECIMAL(3,2) (Measure of Disbelief: 0.00-1.00)

4. **`diagnosis_history`** (Riwayat Diagnosis)
   - `id` INT PRIMARY KEY
   - `user_id` INT FOREIGN KEY
   - `symptoms_selected` JSON (array of symptom IDs & certainty)
   - `diagnosis_results` JSON (hasil diagnosis lengkap)
   - `ai_solution` TEXT
   - `created_at` TIMESTAMP

### 2.2 Data Penyakit & Gejala (Sesuai Dokumen Skripsi)

**7 PENYAKIT:**
```
P01 - Blas (Blast) → 5 gejala
P02 - Hawar Daun Bakteri → 5 gejala
P03 - Hawar Pelepah → 5 gejala
P04 - Bercak Cokelat → 5 gejala
P05 - Tungro → 6 gejala
P06 - Busuk Batang → 5 gejala (termasuk G014 yang overlap dengan P03)
P07 - Bercak Bergaris → 4 gejala
```

**34 GEJALA:**
G01-G034 (sesuai tabel di dokumen skripsi)

**TOTAL RELASI (RULES): 35 rules**

---

## 3. LOGIKA SISTEM YANG BENAR

### 3.1 Alur Kerja Sistem (Workflow)

```
┌─────────────────────────────────┐
│ 1. INPUT USER                   │
│ - Pilih minimal 3 gejala        │
│ - Berikan nilai keyakinan       │
│   (Pasti=1.0, Hampir=0.8, dst)  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. VALIDASI                     │
│ - Cek jumlah gejala >= 3?       │
│ - Jika < 3 → REJECT             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 3. FORWARD CHAINING             │
│ (PARALLEL MATCHING)             │
│                                 │
│ FOR EACH gejala IN input:       │
│   → Cari semua penyakit yang    │
│     memiliki relasi dengan      │
│     gejala tersebut di tabel    │
│     rules                       │
│   → Kelompokkan per penyakit    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 4. CERTAINTY FACTOR             │
│ (PARALLEL CALCULATION)          │
│                                 │
│ FOR EACH penyakit terdeteksi:   │
│   → Hitung CF setiap gejala     │
│   → Kombinasi CF jika > 1       │
│   → Simpan CF_final             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 5. PENALTI & VALIDASI           │
│                                 │
│ FOR EACH penyakit:              │
│   IF jumlah_gejala == 1:        │
│     CF_final × 0.5 (Penalti 50%)│
│   ELSE IF jumlah_gejala == 2:   │
│     CF_final × 0.8 (Penalti 20%)│
│   ELSE:                         │
│     CF_final × 1.0 (No penalti) │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 6. RANKING & FILTERING          │
│                                 │
│ - Urutkan berdasarkan CF DESC   │
│ - Filter CF < threshold (40%)   │
│ - Ambil top 3 penyakit          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 7. AI INTEGRATION               │
│                                 │
│ - Ambil penyakit CF tertinggi   │
│ - Generate prompt untuk AI      │
│ - Dapatkan solusi detail        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 8. OUTPUT                       │
│                                 │
│ - Nama penyakit (ranked)        │
│ - Persentase CF                 │
│ - Tingkat keyakinan             │
│ - Solusi dari AI                │
│ - Saran gejala tambahan         │
└─────────────────────────────────┘
```

### 3.2 Prinsip Dasar

**PENTING:** 
1. ✅ **Paralel, bukan Sequential**: Semua penyakit yang gejalanya dipilih HARUS dihitung CF-nya
2. ✅ **Akumulatif, bukan Single**: Jika 1 penyakit punya banyak gejala cocok, CF-nya digabung
3. ✅ **Penalti untuk Low Match**: Penyakit dengan sedikit gejala diberi penalti
4. ✅ **Threshold untuk Quality**: Hanya tampilkan diagnosis dengan CF memadai

---

## 4. ALGORITMA FORWARD CHAINING

### 4.1 Fungsi Utama: `diagnose_parallel()`

**Tujuan:** Mencari semua penyakit yang gejalanya dipilih user

**Input:**
```python
symptoms_input = [
    {"symptom_id": 1, "certainty": 1.0},  # G01, Pasti
    {"symptom_id": 25, "certainty": 0.8}, # G025, Hampir Pasti
    {"symptom_id": 32, "certainty": 0.6}  # G032, Kemungkinan Besar
]
```

**Proses:**

```python
def diagnose_parallel(symptoms_input):
    """
    Forward Chaining: Parallel Matching
    Mencari semua penyakit yang memiliki relasi dengan gejala input
    """
    
    # 1. VALIDASI INPUT
    if len(symptoms_input) < 3:
        raise ValueError("Minimal 3 gejala harus dipilih")
    
    # 2. EXTRACT SYMPTOM IDs
    symptom_ids = [s['symptom_id'] for s in symptoms_input]
    
    # 3. QUERY DATABASE - Ambil SEMUA relasi yang cocok
    # Query: SELECT * FROM rules WHERE symptom_id IN (symptom_ids)
    matching_rules = db.query(Rule).filter(
        Rule.symptom_id.in_(symptom_ids)
    ).all()
    
    # 4. KELOMPOKKAN BERDASARKAN PENYAKIT
    disease_matches = {}  # {disease_id: [rules]}
    
    for rule in matching_rules:
        disease_id = rule.disease_id
        
        if disease_id not in disease_matches:
            disease_matches[disease_id] = []
        
        disease_matches[disease_id].append({
            'symptom_id': rule.symptom_id,
            'mb': rule.mb,
            'md': rule.md
        })
    
    # 5. RETURN HASIL GROUPING
    return disease_matches, symptoms_input
```

**Output:**
```python
{
    1: [{'symptom_id': 1, 'mb': 0.90, 'md': 0.05}],  # P01 (1 gejala)
    5: [{'symptom_id': 25, 'mb': 0.85, 'md': 0.10}], # P05 (1 gejala)
    7: [{'symptom_id': 32, 'mb': 0.85, 'md': 0.15}]  # P07 (1 gejala)
}
```

---

## 5. ALGORITMA CERTAINTY FACTOR

### 5.1 Formula Dasar

**CF Individual (CF_E):**
```
CF_E = (MB - MD) × Certainty_User
```

**CF Kombinasi (CF_combine) - untuk multiple gejala:**
```
CF_new = CF_old + (CF_current × (1 - CF_old))
```

### 5.2 Fungsi: `calculate_certainty_factor()`

```python
def calculate_certainty_factor(disease_matches, symptoms_input):
    """
    Certainty Factor: Parallel Calculation
    Menghitung CF untuk setiap penyakit yang terdeteksi
    """
    
    results = []
    
    # Buat mapping symptom_id → certainty user
    user_certainty_map = {
        s['symptom_id']: s['certainty'] 
        for s in symptoms_input
    }
    
    # UNTUK SETIAP PENYAKIT YANG TERDETEKSI
    for disease_id, rules in disease_matches.items():
        
        # GET DISEASE INFO
        disease = db.query(Disease).get(disease_id)
        total_symptoms_for_disease = db.query(Rule).filter_by(
            disease_id=disease_id
        ).count()
        
        # HITUNG CF UNTUK SETIAP GEJALA
        cf_values = []
        matched_symptoms = []
        
        for rule in rules:
            symptom_id = rule['symptom_id']
            mb = rule['mb']
            md = rule['md']
            
            # Dapatkan nilai certainty dari user
            user_certainty = user_certainty_map[symptom_id]
            
            # HITUNG CF INDIVIDUAL
            cf_pakar = mb - md
            cf_gejala = cf_pakar * user_certainty
            
            cf_values.append(cf_gejala)
            matched_symptoms.append(symptom_id)
        
        # KOMBINASI CF (jika ada > 1 gejala)
        cf_combined = cf_values[0]
        
        for i in range(1, len(cf_values)):
            cf_current = cf_values[i]
            cf_combined = cf_combined + (cf_current * (1 - cf_combined))
        
        # HITUNG PERSENTASE GEJALA YANG COCOK
        match_percentage = len(rules) / total_symptoms_for_disease
        
        # SIMPAN HASIL
        results.append({
            'disease_id': disease_id,
            'disease_code': disease.kode_p,
            'disease_name': disease.name,
            'cf_raw': cf_combined,
            'symptoms_matched': len(rules),
            'total_symptoms': total_symptoms_for_disease,
            'match_percentage': match_percentage,
            'matched_symptom_ids': matched_symptoms
        })
    
    return results
```

### 5.3 Fungsi: `apply_penalty_and_filter()`

```python
def apply_penalty_and_filter(results):
    """
    Penerapan Penalti & Threshold
    """
    
    for result in results:
        num_symptoms = result['symptoms_matched']
        cf_raw = result['cf_raw']
        
        # PENALTI BERDASARKAN JUMLAH GEJALA
        if num_symptoms == 1:
            penalty = 0.5  # Penalti 50%
            status = "TIDAK PASTI"
        elif num_symptoms == 2:
            penalty = 0.8  # Penalti 20%
            status = "CUKUP VALID"
        else:
            penalty = 1.0  # Tidak ada penalti
            status = "VALID"
        
        # TERAPKAN PENALTI
        cf_final = cf_raw * penalty
        result['cf_final'] = cf_final
        result['penalty'] = penalty
        result['status'] = status
        
        # INTERPRETASI
        if cf_final >= 0.80:
            result['interpretation'] = "PASTI"
        elif cf_final >= 0.60:
            result['interpretation'] = "HAMPIR PASTI"
        elif cf_final >= 0.40:
            result['interpretation'] = "KEMUNGKINAN BESAR"
        elif cf_final >= 0.20:
            result['interpretation'] = "MUNGKIN"
        else:
            result['interpretation'] = "TIDAK PASTI"
    
    # FILTER: Hanya ambil CF >= threshold (0.20 atau 20%)
    filtered_results = [
        r for r in results if r['cf_final'] >= 0.20
    ]
    
    # RANKING: Urutkan berdasarkan CF tertinggi
    filtered_results.sort(key=lambda x: x['cf_final'], reverse=True)
    
    return filtered_results
```

---

## 6. HANDLING KASUS KHUSUS

### 6.1 Kasus 1: Input Gejala Acak (Multiple Disease)

**Contoh:** User pilih G01 (P01), G025 (P05), G032 (P07)

**Handling:**
```python
# Sistem akan mendeteksi 3 penyakit berbeda
# Setiap penyakit hanya punya 1 gejala cocok
# CF setiap penyakit akan rendah setelah penalti

hasil = [
    {'disease': 'P01', 'cf_raw': 0.85, 'cf_final': 0.425, 'status': 'TIDAK PASTI'},
    {'disease': 'P05', 'cf_raw': 0.765, 'cf_final': 0.383, 'status': 'TIDAK PASTI'},
    {'disease': 'P07', 'cf_raw': 0.70, 'cf_final': 0.35, 'status': 'TIDAK PASTI'}
]

# Output ke user:
# "Gejala yang dipilih terlalu acak. Tidak ada diagnosis pasti.
#  Silakan periksa gejala tambahan atau konsultasi ahli."
```

### 6.2 Kasus 2: Multiple Disease dengan CF Tinggi

**Contoh:** User pilih 3 gejala P05, 3 gejala P06, 3 gejala P02

**Handling:**
```python
hasil = [
    {'disease': 'P06', 'cf_final': 0.9974, 'interpretation': 'PASTI'},
    {'disease': 'P02', 'cf_final': 0.9928, 'interpretation': 'PASTI'},
    {'disease': 'P05', 'cf_final': 0.9895, 'interpretation': 'PASTI'}
]

# Output ke user:
# ⚠️ PERINGATAN: INFEKSI MULTIPEL TERDETEKSI
# Tanaman Anda terinfeksi 3 PENYAKIT SEKALIGUS
# 1. Busuk Batang (99.74%) - URGENT
# 2. Hawar Daun Bakteri (99.28%) - URGENT
# 3. Tungro (98.95%) - SERIUS
#
# REKOMENDASI:
# - Isolasi tanaman segera
# - Konsultasi dengan petugas penyuluh pertanian
# - Kemungkinan tanaman harus dicabut dan dimusnahkan
```

### 6.3 Kasus 3: Gejala Minimal (3 gejala, tapi tersebar)

**Contoh:** 2 gejala P05, 1 gejala P01

**Handling:**
```python
hasil = [
    {'disease': 'P05', 'cf_raw': 0.97, 'cf_final': 0.776, 'interpretation': 'HAMPIR PASTI'},
    {'disease': 'P01', 'cf_raw': 0.85, 'cf_final': 0.425, 'interpretation': 'KEMUNGKINAN BESAR'}
]

# Output ke user:
# DIAGNOSIS:
# 1. Tungro (77.6%) - HAMPIR PASTI
#    - 2 dari 6 gejala cocok
# 2. Blas (42.5%) - KEMUNGKINAN BESAR
#    - 1 dari 5 gejala cocok (tingkat keyakinan rendah)
#
# SARAN VERIFIKASI:
# Untuk memastikan Tungro, periksa gejala tambahan:
# ☐ G023 - Anakan berkurang drastis
# ☐ G024 - Daun kaku dan sempit
# ☐ G025 - Malai pendek dan gabah hampa
```

### 6.4 Kasus 4: Gejala Overlap (G014 di P03 dan P06)

**Gejala G014 (Tanaman tampak rebah) muncul di:**
- P03 (Hawar Pelepah): MB=0.60, MD=0.25
- P06 (Busuk Batang): MB=0.70, MD=0.20

**Handling:**
```python
# Jika user pilih G014, sistem akan:
# 1. Menemukan 2 penyakit yang memiliki G014
# 2. Menghitung CF untuk kedua penyakit

# Untuk P03:
CF_P03 = (0.60 - 0.25) × user_certainty = 0.35 × user_certainty

# Untuk P06:
CF_P06 = (0.70 - 0.20) × user_certainty = 0.50 × user_certainty

# P06 akan memiliki CF lebih tinggi untuk gejala yang sama
# Ini benar karena pakar memberikan bobot lebih tinggi untuk P06
```

---

## 7. AI INTEGRATION

### 7.1 Gemini AI Service (Sesuai Kode Anda)

**File:** `backend/services/ai_solution_service.py`

**Fungsi:** `generate_solution_from_ai()`

**Input:**
```python
{
    'disease_name': 'Blas (Blast)',
    'cf_percentage': 98.2,
    'interpretation': 'PASTI',
    'symptoms_matched': ['G01', 'G02', 'G04'],
    'symptoms_description': [
        'Bercak pada daun berbentuk belah ketupat',
        'Tengah bercak abu-abu keputihan',
        'Malai patah atau tidak berisi'
    ]
}
```

**Konstruksi Prompt:**

```python
def generate_solution_from_ai(diagnosis_result):
    """
    Generate solusi menggunakan Gemini AI
    """
    
    disease_name = diagnosis_result['disease_name']
    cf_percentage = diagnosis_result['cf_percentage']
    symptoms_desc = diagnosis_result['symptoms_description']
    
    prompt = f"""
Anda adalah seorang Pakar Penyakit Tanaman Padi dengan pengalaman 20 tahun.

HASIL DIAGNOSIS SISTEM PAKAR:
- Penyakit: {disease_name}
- Tingkat Kepastian: {cf_percentage}%
- Status: Diagnosis Pasti

GEJALA YANG TERIDENTIFIKASI:
{chr(10).join(f'• {symptom}' for symptom in symptoms_desc)}

TUGAS ANDA:
Berikan solusi penanganan yang DETAIL, PRAKTIS, dan APLIKATIF dalam format JSON berikut:

{{
  "penjelasan_penyakit": "Penjelasan singkat tentang penyakit ini dan penyebabnya",
  
  "langkah_penanganan": [
    "Langkah 1: Deskripsi detail",
    "Langkah 2: Deskripsi detail",
    "Langkah 3: Deskripsi detail"
  ],
  
  "rekomendasi_pestisida": [
    {{
      "nama_dagang": "Nama produk",
      "bahan_aktif": "Bahan aktif utama",
      "dosis": "Dosis aplikasi per liter/hektar",
      "cara_aplikasi": "Cara penggunaan"
    }}
  ],
  
  "pencegahan": [
    "Cara pencegahan 1",
    "Cara pencegahan 2",
    "Cara pencegahan 3"
  ],
  
  "catatan_penting": [
    "Catatan atau peringatan penting"
  ]
}}

PENTING:
- Gunakan nama pestisida yang umum tersedia di Indonesia
- Berikan dosis yang spesifik dan aman
- Sertakan cara aplikasi yang jelas
- Jawab HANYA dalam format JSON, tanpa teks tambahan
"""
    
    # Call Gemini API
    response = gemini_model.generate_content(prompt)
    
    # Parse JSON response
    try:
        solution_json = json.loads(response.text)
        return solution_json
    except json.JSONDecodeError:
        # Fallback jika response bukan JSON
        return {
            "penjelasan_penyakit": response.text,
            "langkah_penanganan": ["Konsultasi dengan ahli"],
            "rekomendasi_pestisida": [],
            "pencegahan": [],
            "catatan_penting": ["Response AI tidak valid"]
        }
```

### 7.2 Kapan AI Dipanggil

```python
# AI HANYA dipanggil jika:
# 1. Ada minimal 1 penyakit dengan CF >= 60% (HAMPIR PASTI atau PASTI)
# 2. Untuk penyakit dengan CF tertinggi

if top_result['cf_final'] >= 0.60:
    ai_solution = generate_solution_from_ai(top_result)
else:
    ai_solution = {
        "peringatan": "Diagnosis tidak cukup pasti untuk generate solusi AI",
        "saran": "Silakan pilih gejala tambahan atau konsultasi langsung dengan ahli"
    }
```

---

## 8. IMPLEMENTASI KODE

### 8.1 File yang Harus Diperbaiki

**1. `backend/services/certainty_factor_service.py`**

**HAPUS:**
```python
# Fungsi lama yang kaku
def find_disease_and_rule(symptoms)  # ❌ HAPUS INI
```

**GANTI DENGAN:**
```python
def diagnose_with_certainty_factor(symptoms_input):
    """
    Main function untuk diagnosis menggunakan CF
    
    Args:
        symptoms_input: List[Dict] = [
            {"symptom_id": int, "certainty": float},
            ...
        ]
    
    Returns:
        Dict: {
            "results": List[Dict],  # Hasil diagnosis ranked
            "ai_solution": Dict,     # Solusi dari AI (jika ada)
            "recommendations": List  # Saran gejala tambahan
        }
    """
    
    # 1. VALIDASI
    if len(symptoms_input) < 3:
        raise ValueError("Minimal 3 gejala harus dipilih")
    
    # 2. FORWARD CHAINING (Parallel Matching)
    disease_matches, _ = diagnose_parallel(symptoms_input)
    
    if not disease_matches:
        return {
            "results": [],
            "message": "Tidak ada penyakit yang cocok dengan gejala yang dipilih",
            "recommendations": []
        }
    
    # 3. CERTAINTY FACTOR (Parallel Calculation)
    results = calculate_certainty_factor(disease_matches, symptoms_input)
    
    # 4. PENALTI & FILTERING
    filtered_results = apply_penalty_and_filter(results)
    
    # 5. AI INTEGRATION (hanya untuk top result dengan CF >= 0.60)
    ai_solution = None
    if filtered_results and filtered_results[0]['cf_final'] >= 0.60:
        ai_solution = generate_solution_from_ai(filtered_results[0])
    
    # 6. GENERATE RECOMMENDATIONS (saran gejala tambahan)
    recommendations = generate_symptom_recommendations(filtered_results)
    
    return {
        "results": filtered_results,
        "ai_solution": ai_solution,
        "recommendations": recommendations
    }
```

**2. `backend/services/forward_chaining_service.py`**

**HAPUS:**
```python
# Logika if-else kaku per penyakit
# ❌ HAPUS SEMUA INI
```

**GANTI DENGAN:**
```python
def diagnose_parallel(symptoms_input):
    """
    Forward Chaining dengan parallel matching
    Implementasi seperti di bagian 4.1
    """
    # (Copy code dari section 4.1 di atas)
    pass
```

**3. `backend/api/routes/diagnosis_routes.py`**

**UPDATE endpoint `/api/diagnosis`:**

```python
@diagnosis_bp.route('/diagnose', methods=['POST'])
@jwt_required()
def diagnose():
    """
    Endpoint untuk diagnosis penyakit
    
    Request Body:
    {
        "symptoms": [
            {"symptom_id": 1, "certainty": 1.0},
            {"symptom_id": 5, "certainty": 0.8},
            {"symptom_id": 12, "certainty": 0.6}
        ]
    }
    """
    try:
        data = request.get_json()
        symptoms_input = data.get('symptoms', [])
        
        # Validasi input
        if not symptoms_input or len(symptoms_input) < 3:
            return jsonify({
                'success': False,
                'message': 'Minimal 3 gejala harus dipilih untuk diagnosis akurat'
            }), 400
        
        # Panggil service CF yang sudah diperbaiki
        diagnosis_result = diagnose_with_certainty_factor(symptoms_input)
        
        # Simpan ke history
        user_id = get_jwt_identity()
        save_diagnosis_history(user_id, symptoms_input, diagnosis_result)
        
        return jsonify({
            'success': True,
            'data': diagnosis_result
        }), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan sistem',
            'error': str(e)
        }), 500
```

### 8.2 Helper Functions

**File:** `backend/services/recommendation_service.py`

```python
def generate_symptom_recommendations(diagnosis_results):
    """
    Generate saran gejala tambahan untuk verifikasi
    
    Hanya untuk penyakit dengan CF antara 40-80%
    (terlalu rendah = tidak relevan, terlalu tinggi = sudah pasti)
    """
    recommendations = []
    
    for result in diagnosis_results:
        cf_final = result['cf_final']
        
        # Hanya untuk diagnosis yang "cukup yakin" tapi belum pasti
        if 0.40 <= cf_final < 0.80:
            disease_id = result['disease_id']
            matched_symptoms = result['matched_symptom_ids']
            
            # Cari gejala lain dari penyakit ini yang belum dipilih
            all_symptoms_for_disease = db.query(Rule).filter_by(
                disease_id=disease_id
            ).all()
            
            unmatched_symptoms = [
                rule.symptom for rule in all_symptoms_for_disease
                if rule.symptom_id not in matched_symptoms
            ]
            
            if unmatched_symptoms:
                recommendations.append({
                    'disease_code': result['disease_code'],
                    'disease_name': result['disease_name'],
                    'current_cf': cf_final,
                    'suggested_symptoms': [
                        {
                            'code': s.kode_g,
                            'name': s.name
                        }
                        for s in unmatched_symptoms[:4]  # Max 4 saran
                    ],
                    'message': f'Untuk memastikan diagnosis {result["disease_name"]}, '
                               f'periksa apakah tanaman juga menunjukkan gejala berikut:'
                })
    
    return recommendations
```

### 8.3 Database Seeder (Data Awal)

**File:** `backend/seed_data.py`

```python
def seed_diseases():
    """Seed data penyakit sesuai dokumen skripsi"""
    diseases_data = [
        {'kode_p': 'P01', 'name': 'Blas (Blast)', 
         'description': 'Penyakit jamur yang menyerang daun, leher malai, dan gabah'},
        {'kode_p': 'P02', 'name': 'Hawar Daun Bakteri',
         'description': 'Penyakit bakteri yang menyebabkan daun menguning dan layu'},
        {'kode_p': 'P03', 'name': 'Hawar Pelepah',
         'description': 'Penyakit jamur pada pelepah daun'},
        {'kode_p': 'P04', 'name': 'Bercak Cokelat',
         'description': 'Penyakit jamur yang menimbulkan bercak coklat pada daun'},
        {'kode_p': 'P05', 'name': 'Tungro',
         'description': 'Penyakit virus yang menyebabkan tanaman kerdil'},
        {'kode_p': 'P06', 'name': 'Busuk Batang',
         'description': 'Penyakit jamur yang membusukkan batang'},
        {'kode_p': 'P07', 'name': 'Bercak Bergaris',
         'description': 'Penyakit jamur dengan bercak bergaris pada daun'}
    ]
    
    for data in diseases_data:
        disease = Disease(**data)
        db.session.add(disease)
    
    db.session.commit()

def seed_symptoms():
    """Seed data gejala sesuai dokumen skripsi"""
    # Data G01-G034 sesuai tabel di dokumen
    # (Copy dari dokumen skripsi Anda)
    pass

def seed_rules():
    """Seed data relasi (rules) dengan nilai MB & MD"""
    rules_data = [
        # P01 - Blas
        {'disease_code': 'P01', 'symptom_code': 'G01', 'mb': 0.90, 'md': 0.05},
        {'disease_code': 'P01', 'symptom_code': 'G02', 'mb': 0.80, 'md': 0.10},
        {'disease_code': 'P01', 'symptom_code': 'G03', 'mb': 0.85, 'md': 0.02},
        {'disease_code': 'P01', 'symptom_code': 'G04', 'mb': 0.75, 'md': 0.15},
        {'disease_code': 'P01', 'symptom_code': 'G05', 'mb': 0.60, 'md': 0.25},
        
        # P02 - Hawar Daun Bakteri
        {'disease_code': 'P02', 'symptom_code': 'G06', 'mb': 0.85, 'md': 0.05},
        # ... (sesuai dokumen, total 35 rules)
    ]
    
    for data in rules_data:
        disease = Disease.query.filter_by(kode_p=data['disease_code']).first()
        symptom = Symptom.query.filter_by(kode_g=data['symptom_code']).first()
        
        rule = Rule(
            disease_id=disease.id,
            symptom_id=symptom.id,
            mb=data['mb'],
            md=data['md']
        )
        db.session.add(rule)
    
    db.session.commit()
```

---

## 9. VALIDASI & TESTING

### 9.1 Unit Tests

**File:** `backend/tests/test_certainty_factor.py`

```python
import pytest
from services.certainty_factor_service import diagnose_with_certainty_factor

def test_minimal_3_gejala():
    """Test validasi minimal 3 gejala"""
    symptoms = [
        {"symptom_id": 1, "certainty": 1.0},
        {"symptom_id": 2, "certainty": 0.8}
    ]
    
    with pytest.raises(ValueError, match="Minimal 3 gejala"):
        diagnose_with_certainty_factor(symptoms)

def test_single_disease_multiple_symptoms():
    """Test diagnosis 1 penyakit dengan beberapa gejala"""
    symptoms = [
        {"symptom_id": 1, "certainty": 1.0},  # G01 → P01
        {"symptom_id": 2, "certainty": 1.0},  # G02 → P01
        {"symptom_id": 3, "certainty": 1.0}   # G03 → P01
    ]
    
    result = diagnose_with_certainty_factor(symptoms)
    
    assert len(result['results']) >= 1
    assert result['results'][0]['disease_code'] == 'P01'
    assert result['results'][0]['cf_final'] > 0.90
    assert result['results'][0]['interpretation'] == 'PASTI'

def test_multiple_diseases_random_symptoms():
    """Test diagnosis dengan gejala acak dari berbagai penyakit"""
    symptoms = [
        {"symptom_id": 1, "certainty": 1.0},   # G01 → P01
        {"symptom_id": 25, "certainty": 0.8},  # G025 → P05
        {"symptom_id": 32, "certainty": 0.6}   # G032 → P07
    ]
    
    result = diagnose_with_certainty_factor(symptoms)
    
    # Harus mendeteksi 3 penyakit berbeda
    assert len(result['results']) == 3
    
    # Setiap penyakit hanya punya 1 gejala → CF harus rendah (penalti 50%)
    for diagnosis in result['results']:
        assert diagnosis['symptoms_matched'] == 1
        assert diagnosis['cf_final'] < 0.50  # Setelah penalti
        assert diagnosis['status'] == 'TIDAK PASTI'

def test_cf_combination():
    """Test kombinasi CF untuk multiple gejala"""
    # P01 dengan G01 dan G02
    # CF1 = (0.90 - 0.05) × 1.0 = 0.85
    # CF2 = (0.80 - 0.10) × 1.0 = 0.70
    # CF_combined = 0.85 + 0.70 × (1 - 0.85) = 0.955
    
    symptoms = [
        {"symptom_id": 1, "certainty": 1.0},
        {"symptom_id": 2, "certainty": 1.0},
        {"symptom_id": 10, "certainty": 1.0}  # Gejala dummy
    ]
    
    result = diagnose_with_certainty_factor(symptoms)
    p01_result = next(r for r in result['results'] if r['disease_code'] == 'P01')
    
    assert p01_result['cf_raw'] >= 0.95
    assert p01_result['cf_raw'] <= 0.96

def test_penalty_application():
    """Test penerapan penalti"""
    # 1 gejala → penalti 50%
    symptoms_1 = [
        {"symptom_id": 1, "certainty": 1.0},
        {"symptom_id": 25, "certainty": 1.0},
        {"symptom_id": 32, "certainty": 1.0}
    ]
    
    result = diagnose_with_certainty_factor(symptoms_1)
    
    for diagnosis in result['results']:
        if diagnosis['symptoms_matched'] == 1:
            assert diagnosis['penalty'] == 0.5
        elif diagnosis['symptoms_matched'] == 2:
            assert diagnosis['penalty'] == 0.8
        else:
            assert diagnosis['penalty'] == 1.0
```

### 9.2 Integration Tests

**File:** `backend/tests/test_diagnosis_api.py`

```python
def test_diagnosis_endpoint_valid(client, auth_headers):
    """Test endpoint diagnosis dengan input valid"""
    response = client.post('/api/diagnosis/diagnose', 
        headers=auth_headers,
        json={
            "symptoms": [
                {"symptom_id": 1, "certainty": 1.0},
                {"symptom_id": 2, "certainty": 0.8},
                {"symptom_id": 3, "certainty": 1.0}
            ]
        })
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert data['success'] == True
    assert 'results' in data['data']
    assert len(data['data']['results']) >= 1

def test_diagnosis_endpoint_invalid_min_symptoms(client, auth_headers):
    """Test endpoint dengan kurang dari 3 gejala"""
    response = client.post('/api/diagnosis/diagnose',
        headers=auth_headers,
        json={
            "symptoms": [
                {"symptom_id": 1, "certainty": 1.0},
                {"symptom_id": 2, "certainty": 0.8}
            ]
        })
    
    assert response.status_code == 400
    data = response.get_json()
    assert 'minimal 3 gejala' in data['message'].lower()
```

### 9.3 Manual Testing Scenarios

**Skenario 1:** Diagnosis Normal (3 gejala dari 1 penyakit)
```
Input: G01, G02, G03 (semua P01-Blas)
Expected:
- P01 terdeteksi dengan CF > 90%
- Status: PASTI
- AI solution: Generated
```

**Skenario 2:** Gejala Acak
```
Input: G01, G025, G032
Expected:
- 3 penyakit terdeteksi (P01, P05, P07)
- Semua CF < 50% (setelah penalti)
- Status: TIDAK PASTI
- Pesan: "Gejala terlalu acak, pilih gejala tambahan"
```

**Skenario 3:** Multiple Disease dengan CF Tinggi
```
Input: 3 gejala P05, 3 gejala P06, 3 gejala P02
Expected:
- 3 penyakit dengan CF > 90%
- Peringatan: INFEKSI MULTIPEL
- Rekomendasi: Konsultasi ahli
```

**Skenario 4:** Gejala Overlap (G014)
```
Input: G014, G027, G028 (G014 ada di P03 dan P06)
Expected:
- P06 CF lebih tinggi dari P03 (karena MB-MD lebih tinggi)
- Keduanya terdeteksi, tapi P06 ranked #1
```

---

## 10. DEPLOYMENT CHECKLIST

### 10.1 Pre-Deployment

- [ ] **Database Migration**
  ```bash
  flask db upgrade
  python seed_data.py
  ```

- [ ] **Environment Variables**
  - [ ] `SECRET_KEY` (min 32 karakter)
  - [ ] `JWT_SECRET_KEY` (min 32 karakter)
  - [ ] `GEMINI_API_KEY` atau `OPENAI_API_KEY`
  - [ ] `DATABASE_URL` (PostgreSQL untuk production)
  - [ ] `FLASK_ENV=production`

- [ ] **Security Checklist**
  - [ ] HTTPS/SSL enabled
  - [ ] CORS configured properly
  - [ ] Rate limiting implemented
  - [ ] SQL injection prevention (SQLAlchemy ORM)
  - [ ] XSS protection (sanitize inputs)

- [ ] **Testing**
  - [ ] All unit tests pass
  - [ ] All integration tests pass
  - [ ] Manual testing scenarios completed
  - [ ] Performance testing (load test)

### 10.2 Post-Deployment Monitoring

- [ ] **Logging**
  ```python
  import logging
  
  logging.basicConfig(
      filename='diagnosis.log',
      level=logging.INFO,
      format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
  )
  
  # Log setiap diagnosis
  logger.info(f"User {user_id} diagnosed: {diagnosis_result}")
  ```

- [ ] **Metrics to Track**
  - Average diagnosis time
  - CF distribution (berapa % diagnosis dengan CF > 80%)
  - Most common symptoms selected
  - AI API call success rate
  - Error rate per endpoint

- [ ] **Alerts**
  - API response time > 5 seconds
  - Error rate > 5%
  - AI API failures
  - Database connection issues

---

## 11. FREQUENTLY ASKED QUESTIONS (FAQ)

### Q1: Kenapa harus minimal 3 gejala?
**A:** Karena dengan 1-2 gejala saja, diagnosis sangat tidak akurat. Penyakit tanaman memiliki gejala yang overlap, jadi butuh minimal 3 gejala untuk membedakan dengan lebih baik.

### Q2: Bagaimana jika user memilih gejala dari berbagai penyakit?
**A:** Sistem akan menghitung semua penyakit secara paralel. Setiap penyakit yang hanya punya sedikit gejala cocok akan diberi penalti, sehingga CF-nya turun. User akan mendapat pesan bahwa diagnosis tidak pasti.

### Q3: Apa bedanya metode lama (v1.0) dengan yang baru (v2.0)?
**A:** 
- **v1.0:** Hanya mencari 1 penyakit dengan exact match, CF dihitung sekali
- **v2.0:** Semua penyakit yang gejalanya dipilih dihitung paralel, ada penalti untuk low match, ada threshold untuk filter hasil

### Q4: Apakah AI akan selalu dipanggil?
**A:** Tidak. AI hanya dipanggil jika diagnosis memiliki CF ≥ 60% (HAMPIR PASTI atau PASTI). Jika CF terlalu rendah, sistem akan menyarankan user untuk pilih gejala tambahan.

### Q5: Bagaimana menangani gejala yang sama di 2 penyakit berbeda (seperti G014)?
**A:** Sistem akan menghitung CF untuk kedua penyakit. Penyakit dengan nilai MB-MD lebih tinggi akan mendapat CF lebih tinggi untuk gejala yang sama.

### Q6: Berapa lama retention data diagnosis?
**A:** 30 hari (configurable di `HISTORY_RETENTION_DAYS`)

### Q7: Apakah sistem bisa mendeteksi infeksi ganda (multiple disease)?
**A:** Ya. Jika ada 2+ penyakit dengan CF ≥ 80%, sistem akan memberikan peringatan "INFEKSI MULTIPEL" dan merekomendasikan konsultasi dengan ahli.

---

## 12. KESIMPULAN & NEXT STEPS

### 12.1 Summary Perbaikan

Logika baru ini memperbaiki 4 kesalahan utama sistem v1.0:

1. ✅ **Forward Chaining Paralel**: Semua penyakit yang relevan dihitung
2. ✅ **CF Akumulatif**: Multiple gejala per penyakit digabung dengan benar
3. ✅ **Validasi & Penalti**: Sistem lebih cerdas menilai kualitas diagnosis
4. ✅ **AI Integration**: Hanya dipanggil untuk diagnosis yang pasti

### 12.2 Implementation Steps untuk Codex CLI

**Step 1:** Backup kode lama
```bash
git checkout -b backup-v1.0
git add .
git commit -m "Backup sebelum refactoring"
git checkout main
```

**Step 2:** Buat file-file baru sesuai blueprint
```bash
# File prioritas:
1. backend/services/certainty_factor_service.py (REFACTOR TOTAL)
2. backend/services/forward_chaining_service.py (REFACTOR TOTAL)
3. backend/services/recommendation_service.py (BARU)
4. backend/api/routes/diagnosis_routes.py (UPDATE)
```

**Step 3:** Testing
```bash
pytest backend/tests/
```

**Step 4:** Deploy
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### 12.3 Future Enhancements

1. **Image Recognition**: Tambahkan computer vision untuk deteksi gejala dari foto
2. **Multilingual**: Support bahasa Jawa/Sunda untuk petani lokal
3. **Mobile App**: React Native untuk akses offline
4. **Expert Feedback Loop**: Fitur untuk pakar memberikan feedback ke hasil diagnosis
5. **Epidemiological Analysis**: Dashboard untuk tracking penyebaran penyakit

---

## 📞 KONTAK & SUPPORT

Jika ada pertanyaan tentang implementasi blueprint ini:
- **Repository:** https://github.com/IssomAgustian/sistem-pakarV1
- **Documentation:** `/docs` folder in repository
- **Issues:** GitHub Issues untuk bug reports

---

**© 2024 - Sistem Pakar Diagnosis Penyakit Tanaman Padi**
**Version 2.0 - Complete Refactoring Blueprint**

---

## APPENDIX A: Tabel Relasi Lengkap (35 Rules)

```
| No | Penyakit | Kode Gejala | MB   | MD   | CF   |
|----|----------|-------------|------|------|------|
| 1  | P01      | G01         | 0.90 | 0.05 | 0.85 |
| 2  | P01      | G02         | 0.80 | 0.10 | 0.70 |
| 3  | P01      | G03         | 0.85 | 0.02 | 0.83 |
| 4  | P01      | G04         | 0.75 | 0.15 | 0.60 |
| 5  | P01      | G05         | 0.60 | 0.25 | 0.35 |
| 6  | P02      | G06         | 0.85 | 0.05 | 0.80 |
| 7  | P02      | G07         | 0.80 | 0.10 | 0.70 |
| 8  | P02      | G08         | 0.90 | 0.02 | 0.88 |
| 9  | P02      | G09         | 0.65 | 0.25 | 0.40 |
| 10 | P02      | G010        | 0.70 | 0.20 | 0.50 |
| 11 | P03      | G011        | 0.80 | 0.10 | 0.70 |
| 12 | P03      | G012        | 0.85 | 0.05 | 0.80 |
| 13 | P03      | G013        | 0.75 | 0.15 | 0.60 |
| 14 | P03      | G014        | 0.60 | 0.25 | 0.35 |
| 15 | P03      | G015        | 0.60 | 0.30 | 0.30 |
| 16 | P04      | G016        | 0.80 | 0.15 | 0.65 |
| 17 | P04      | G017        | 0.85 | 0.05 | 0.80 |
| 18 | P04      | G018        | 0.70 | 0.20 | 0.50 |
| 19 | P04      | G019        | 0.60 | 0.30 | 0.30 |
| 20 | P04      | G020        | 0.75 | 0.15 | 0.60 |
| 21 | P05      | G021        | 0.90 | 0.05 | 0.85 |
| 22 | P05      | G022        | 0.90 | 0.10 | 0.80 |
| 23 | P05      | G023        | 0.80 | 0.15 | 0.65 |
| 24 | P05      | G024        | 0.75 | 0.20 | 0.55 |
| 25 | P05      | G025        | 0.85 | 0.10 | 0.75 |
| 26 | P05      | G026        | 0.70 | 0.20 | 0.50 |
| 27 | P06      | G027        | 0.85 | 0.10 | 0.75 |
| 28 | P06      | G028        | 0.90 | 0.05 | 0.85 |
| 29 | P06      | G029        | 0.95 | 0.02 | 0.93 |
| 30 | P06      | G030        | 0.80 | 0.15 | 0.65 |
| 31 | P06      | G014        | 0.70 | 0.20 | 0.50 |
| 32 | P07      | G031        | 0.90 | 0.10 | 0.80 |
| 33 | P07      | G032        | 0.85 | 0.15 | 0.70 |
| 34 | P07      | G033        | 0.70 | 0.20 | 0.50 |
| 35 | P07      | G034        | 0.65 | 0.25 | 0.40 |
```

## APPENDIX B: Contoh Response API

**Success Case - Single Disease:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "disease_id": 1,
        "disease_code": "P01",
        "disease_name": "Blas (Blast)",
        "cf_raw": 0.992,
        "cf_final": 0.992,
        "symptoms_matched": 3,
        "total_symptoms": 5,
        "match_percentage": 0.6,
        "penalty": 1.0,
        "status": "VALID",
        "interpretation": "PASTI"
      }
    ],
    "ai_solution": {
      "penjelasan_penyakit": "Blas adalah penyakit jamur...",
      "langkah_penanganan": ["Langkah 1", "Langkah 2"],
      "rekomendasi_pestisida": [{...}],
      "pencegahan": ["Cara 1", "Cara 2"],
      "catatan_penting": ["Catatan 1"]
    },
    "recommendations": []
  }
}
```

**Warning Case - Multiple Disease:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "disease_code": "P06",
        "disease_name": "Busuk Batang",
        "cf_final": 0.9974,
        "interpretation": "PASTI"
      },
      {
        "disease_code": "P02",
        "disease_name": "Hawar Daun Bakteri",
        "cf_final": 0.9928,
        "interpretation": "PASTI"
      },
      {
        "disease_code": "P05",
        "disease_name": "Tungro",
        "cf_final": 0.9895,
        "interpretation": "PASTI"
      }
    ],
    "warning": "INFEKSI MULTIPEL TERDETEKSI",
    "ai_solution": {...},
    "recommendations": []
  }
}
```

**Low Confidence Case:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "disease_code": "P01",
        "cf_final": 0.425,
        "interpretation": "KEMUNGKINAN BESAR",
        "status": "TIDAK PASTI"
      }
    ],
    "ai_solution": null,
    "recommendations": [
      {
        "disease_code": "P01",
        "message": "Untuk memastikan diagnosis Blas, periksa gejala berikut:",
        "suggested_symptoms": [
          {"code": "G02", "name": "Tengah bercak abu-abu keputihan"},
          {"code": "G03", "name": "Leher malai menghitam"}
        ]
      }
    ]
  }
}
```

---

**END OF BLUEPRINT**