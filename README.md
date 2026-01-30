# 🌾 Sistem Pakar Diagnosis Penyakit Tanaman Padi

> Expert System for Rice Plant Disease Diagnosis using Hybrid Method: Forward Chaining + Certainty Factor with AI Solution Generator

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌾 Overview

Sistem Pakar Padi adalah aplikasi web full-stack yang membantu diagnosis penyakit tanaman padi menggunakan kombinasi metode:

- **Forward Chaining**: Untuk pencocokan gejala dengan aturan (rule-based reasoning)
- **Certainty Factor**: Untuk kalkulasi tingkat kepercayaan diagnosis
- **AI Integration**: OpenAI GPT-4 atau Google Gemini untuk menghasilkan solusi perawatan yang detail

**⚠️ IMPORTANT**: Sistem ini adalah **symptom-based expert system**, bukan image recognition. AI digunakan untuk menghasilkan rekomendasi perawatan berdasarkan hasil diagnosis, bukan untuk mendeteksi penyakit dari gambar.

## 🏗️ Architecture

### Frontend
- React.js 18.2+ with Vite
- Tailwind CSS + DaisyUI
- React Router for navigation
- Axios for API calls

### Backend
- **Framework**: Flask 3.0+ (Python 3.10+)
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **ORM**: SQLAlchemy with Flask-Migrate (Alembic)
- **Authentication**: JWT + Google OAuth 2.0
- **API Documentation**: RESTful API with JSON responses

### AI Services
- **Providers**: OpenAI GPT-4 or Google Gemini (configurable)
- **Purpose**: Generating detailed treatment solutions and recommendations
- **Note**: NOT used for image recognition - this is a symptom-based expert system

## 📁 Project Structure

```
sistem-pakar-padi/
├── frontend/          # React application
├── backend/           # Flask API
├── docker/            # Docker configurations
├── docs/              # Documentation
└── docker-compose.yml # Docker orchestration
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/IssomAgustian/sistem-pakarV1.git
   cd sistem-pakarV1
   ```

2. **Setup environment variables**

   **IMPORTANT**: Never commit `.env` files to version control!

   ```bash
   # Docker / Production
   cp .env.example .env

   # Local development
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   **Required Environment Variables:**

   **Backend** (`backend/.env`):
   ```env
   # Flask Configuration
   SECRET_KEY=your-random-secret-key-here-min-32-chars
   JWT_SECRET_KEY=your-jwt-secret-key-here-min-32-chars
   FLASK_ENV=development  # Change to 'production' for production

   # Database (use SQLite for dev, PostgreSQL for production)
   DATABASE_URL=sqlite:///pakar_padi.db
   # DATABASE_URL=postgresql://user:password@localhost:5432/pakar_padi

   # CORS
   FRONTEND_URL=http://localhost:3001

   # AI Provider (choose 'openai' or 'gemini')
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-openai-api-key-here
   GEMINI_API_KEY=your-gemini-api-key-here

   # Google OAuth (get from https://console.cloud.google.com/)
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret

   # System Settings
   HISTORY_RETENTION_DAYS=30
   MAX_DIAGNOSES_PER_DAY=20
   ```

   **Frontend** (`frontend/.env`):
   ```env
   VITE_API_URL=/api
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_APP_NAME=Sistem Pakar Padi
   VITE_APP_VERSION=1.0.0
   ```

3. **Run with Docker (Recommended - detailed)**

   **Step-by-step**
   1) **Prepare the root `.env`**
      - Docker uses the root `.env` (not `backend/.env`).
      - Edit `.env` and make sure these are correct:
        - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
        - `DATABASE_URL` should point to `db:5432` (default in `.env.example`)

   2) **Build and start containers**
      ```bash
      docker compose up -d --build
      ```
      If your Docker still uses the old command, use:
      ```bash
      docker-compose up -d --build
      ```

   3) **Check container status**
      ```bash
      docker compose ps
      ```

   4) **Initialize database**
      By default migrations run automatically on container start when
      `RUN_MIGRATIONS=true`. You can still run them manually if needed:
      ```bash
      docker compose exec backend flask db upgrade
      ```
      For initial data seeding, either set `RUN_SEED=true` in `.env`
      (and optionally `RESET_SEED=true` to re-seed) or run manually:
      ```bash
      docker compose exec backend python seed_data.py
      ```

   5) **Access the application**
      - Frontend: http://localhost
      - Backend API: http://localhost/api/health
      - Admin Panel: http://localhost/admin

   6) **View logs (if something fails)**
      ```bash
      docker compose logs -f backend
      docker compose logs -f frontend
      docker compose logs -f db
      ```

   7) **Stop containers**
      ```bash
      docker compose down
      ```

### Manual Setup (Without Docker)

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
flask db upgrade
python seed_data.py
python run.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📋 Features

### User Features
- ✅ Login/Register (Email + Google OAuth)
- ✅ Symptom-based diagnosis with category filtering
- ✅ Certainty factor input for partial matches
- ✅ AI-generated treatment solutions
- ✅ Diagnosis history (30-day retention)
- ✅ PDF export of results
- ✅ Pagination (20 items per page)

### Admin Features (11 Menus)
1. Dashboard - System overview
2. Kelola Penyakit - Disease management
3. Kelola Gejala - Symptom management
4. Kelola Rule Base - Rule management
5. Data Pengguna - User management
6. Riwayat Diagnosis - Diagnosis history
7. Laporan & Analisis - Reports & analytics
8. Pengaturan Sistem - System settings
9. Logs & Aktivitas - Activity logs
10. Pengaturan - Admin settings
11. Login/Logout - Authentication

## 🔐 Security

### Security Features
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: Werkzeug PBKDF2 SHA-256
- ✅ **CORS Protection**: Configurable CORS policies
- ✅ **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- ✅ **Rate Limiting**: Max diagnoses per day (configurable)
- ✅ **Environment-based Configuration**: Separate dev/prod configs

### Important Security Notes

⚠️ **NEVER commit the following files to version control:**
- `backend/.env` (contains API keys and secrets)
- `frontend/.env` (contains client IDs)
- `backend/instance/*.db` (SQLite database with user data)
- `*.log` files (may contain sensitive information)
- Session cookies or tokens

⚠️ **Before deploying to production:**
1. Generate strong random secrets for `SECRET_KEY` and `JWT_SECRET_KEY`
2. Use PostgreSQL instead of SQLite
3. Set `FLASK_ENV=production`
4. Enable HTTPS/SSL
5. Configure proper CORS origins
6. Implement rate limiting on API endpoints
7. Regularly rotate API keys
8. Keep dependencies updated

⚠️ **API Keys Required:**
- **OpenAI API Key**: Get from https://platform.openai.com/api-keys
- **Google Gemini API Key**: Get from https://makersuite.google.com/app/apikey
- **Google OAuth Credentials**: Get from https://console.cloud.google.com/apis/credentials

All `.env.example` files contain placeholder values only. You must replace them with your actual credentials.

## 📊 Database Schema

Main tables:
- `users` - User accounts
- `diseases` - Disease information
- `symptoms` - Symptoms with MB/MD values
- `rules` - Forward chaining rules
- `diagnosis_history` - Diagnosis records with AI solutions
- `admin_logs` - Admin activity tracking
- `system_settings` - System configuration

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

API endpoints are available at `/api/`:
- `/api/auth/*` - Authentication
- `/api/diagnosis/*` - Diagnosis operations
- `/api/symptoms/*` - Symptom data
- `/api/diseases/*` - Disease data
- `/api/history/*` - User history
- `/api/users/*` - User management

Detailed API documentation: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

## 🤝 Contributing

This is a thesis project. For contributions or issues, please contact the project maintainer.

## 📄 License

Copyright © 2024. All rights reserved.

## 👨‍💻 Author

Developed as a thesis project for Rice Plant Disease Expert System.

## 📚 References

Based on the blueprint document: `new_rancangan_fullstack.md`

Frontend reference: https://github.com/IssomAgustian/diagnosa-padi
