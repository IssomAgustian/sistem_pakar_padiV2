## Deployment Guide (Docker Compose)

This project is prepared for deployment using Docker Compose with:
- PostgreSQL (database)
- Flask + Gunicorn (backend)
- Nginx (serves React build and proxies /api + /admin)

### 1) Prepare environment variables

Copy and edit the root env file:

```
cp .env.example .env
```

Fill at least:
- POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD
- SECRET_KEY / JWT_SECRET_KEY (use long random values)
- FRONTEND_URL (your public domain, e.g. https://example.com)
- ADMIN_EMAIL / ADMIN_PASSWORD (for initial admin user)

### 2) Build and start services

```
docker-compose up -d --build
```

### 3) Run database migrations

By default migrations are run automatically on container start when
`RUN_MIGRATIONS=true`. You can still run them manually if needed:

```
docker-compose exec backend flask db upgrade
```

### 4) Seed initial data (optional, recommended for first run)

You can enable automatic seeding by setting `RUN_SEED=true` in `.env`
(and optionally `RESET_SEED=true` to re-seed), or run it manually:

```
docker-compose exec backend python seed_data.py
```

### 5) Access the app

- Frontend: http://your-domain/
- Admin: http://your-domain/admin
- API: http://your-domain/api
- Health: http://your-domain/health

---

## Local Development (without Docker)

### Backend

```
cd backend
cp .env.example .env
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
flask db upgrade
python seed_data.py
python run.py
```

### Frontend

```
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Notes

- The frontend build uses Vite env variables at build time. For production, set VITE_* values in `.env`.
- Nginx proxies `/api`, `/admin`, `/static`, and `/health` to the backend.
- If you do not want to auto-run migrations on container start, set `RUN_MIGRATIONS=false` in `.env`.
