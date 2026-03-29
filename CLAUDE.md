# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kelibia Smart City — a citizen services platform for the city of Kelibia, Tunisia. Citizens can request civil documents (birth/marriage/death certificates, residence attestations), submit complaints, use a community forum, and view news. Two user roles: `citizen` and `agent` (municipal agent).

## Commands

### Backend (Django) — run from project root with venv active

```bash
# Activate venv first (Windows)
.\.venv\Scripts\activate

python manage.py runserver          # Start backend: http://127.0.0.1:8000
python manage.py migrate            # Apply migrations
python manage.py makemigrations     # Generate new migrations
python manage.py shell              # Django interactive shell
python recreate_superuser.py        # Reset/create superuser
python manage.py test               # Run Django tests
python manage.py test accounts      # Run tests for a specific app
```

### Frontend React — run from `frontend-react/`

```bash
npm run dev      # Vite dev server (proxies /api/* to Django on :8000)
npm run build    # Production build → dist/
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Legacy HTML Frontend

```bash
python run_frontend.py   # Serves frontend/ on http://127.0.0.1:5500
```
> Use `http://127.0.0.1:5500` (not `localhost:5500`) — SSO auth breaks on `localhost`.

### Start Everything (Windows)

Double-click `start_dev.bat` — launches backend (:8000) + legacy frontend (:5500) in separate terminals.

### Production Build

```bash
bash build.sh   # pip install + collectstatic + migrate
```

## Architecture

### Backend Django Apps

| App | Purpose |
|---|---|
| `accounts` | Custom user model, JWT auth, CIN image upload |
| `extrait_naissance` | Birth certificate requests |
| `extrait_mariage` | Marriage certificate requests |
| `extrait_deces` | Death certificate requests |
| `attestation_residence` | Residence attestation requests |
| `reclamations` | Citizen complaints |
| `forum` | Community forum (topics, replies, votes, notifications) |
| `news` | Announcements |
| `signalement` | Geo-tagged reports/alerts |
| `services` | Shared service utilities |

### URL Structure (`core/urls.py`)

- `/api/` — djoser auth + JWT endpoints
- `/api/token/` — JWT login (`MyTokenObtainPairView`)
- `/api/accounts/` — user profile, CIN upload
- `/api/services/`, `/api/reclamations/`, `/api/news/`, `/api/forum/`, `/api/residence/`, `/api/signalement/`
- `/extrait-naissance/`, `/extrait-mariage/`, `/extrait-deces/` — certificate-specific endpoints (not under `/api/`)
- `/signalement/`, `/dashboard/` — also map to signalement app

### Authentication

- Custom user model: `accounts.CustomUser` (extends `AbstractUser`)
- Login field: **email** (not username)
- JWT via `djangorestframework_simplejwt` + djoser; access token: 60 min, refresh: 1 day
- `is_verified` flag on user — agents verify citizen accounts
- CIN front/back images uploaded to `media/cin_images/`

### Dual Frontend

- **`frontend/`** — legacy HTML/CSS/JS, operational, uses `http://127.0.0.1:5500`
- **`frontend-react/`** — React 19 + TypeScript + Vite, actively being developed; proxies all API calls to Django

### Database

PostgreSQL, database name `kelibia_db`, user `postgres`, password `admin` (configured in `core/settings.py`). Override via `DATABASE_URL` env var.

### Key Files

- `core/settings.py` — all Django config (DB, JWT, CORS, email SMTP)
- `frontend-react/vite.config.ts` — proxy rules mapping frontend paths to Django
- `seed_data.py`, `seed_hajjem_family.py` — database seeding scripts
- `test_api.py` — manual API integration tests
