## API Documentation (Ringkas)

Base URL:
- `/api`

### Auth
- `POST /api/auth/register`
  - body: `{ "email": "", "password": "", "full_name": "" }`
- `POST /api/auth/login`
  - body: `{ "email": "", "password": "" }`
- `GET /api/auth/me`
  - header: `Authorization: Bearer <token>`

### Diagnosis
- `POST /api/diagnosis/start`
  - header: `Authorization: Bearer <token>`
  - body: `{ "symptom_ids": [1,2], "certainty_values": { "1": 1.0 } }`

### Symptoms
- `GET /api/symptoms`

### Diseases
- `GET /api/diseases`

### History
- `GET /api/history`
  - header: `Authorization: Bearer <token>`

Catatan:
- Semua response menggunakan JSON.
- JWT disimpan di client, dan dikirim via header `Authorization`.
