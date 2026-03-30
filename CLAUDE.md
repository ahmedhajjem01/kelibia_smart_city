# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kelibia Smart City** — a bilingual (French/Arabic) citizen services platform for the municipality of Kelibia, Tunisia.

Citizens can:
- Request civil documents (birth/marriage/death certificates, residence attestations)
- Submit and track complaints (auto-classified by ML)
- Use the community forum
- View municipal news/announcements

Two user roles: `citizen` and `agent` (municipal agent).

---

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
python manage.py test               # Run all Django tests
python manage.py test accounts      # Run tests for a specific app
python seed_data.py                 # Seed demo data (idempotent)
python seed_data.py --reset         # Clear test data then reseed
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

---

## Architecture

### Backend Django Apps

| App | Purpose |
|---|---|
| `accounts` | Custom user model (`CustomUser`), JWT auth, CIN image upload, agent verification |
| `reclamations` | Citizen complaints with ML/NLP auto-classification (category + priority) |
| `forum` | Community forum — topics, replies, votes, notifications |
| `services` | Bilingual service catalog (FR/AR categories, descriptions, requirements) |
| `extrait_naissance` | Birth certificate records + citizen declaration requests |
| `extrait_mariage` | Marriage certificate records + marriage requests |
| `extrait_deces` | Death certificate records + declaration requests |
| `attestation_residence` | Residence attestation requests |
| `news` | Municipal announcements/articles |
| `signalement` | Geo-tagged reports/alerts (alt complaint system, simpler schema) |

### URL Structure (`core/urls.py`)

- `/admin/` — Django admin
- `/api/` — djoser auth + JWT endpoints
- `/api/token/` — JWT login (`MyTokenObtainPairView`)
- `/api/accounts/` — register, activate, profile (`me/`)
- `/api/services/`, `/api/reclamations/`, `/api/news/`, `/api/forum/`, `/api/residence/`, `/api/signalement/`
- `/extrait-naissance/`, `/extrait-mariage/`, `/extrait-deces/` — certificate endpoints (NOT under `/api/`)
- `/signalement/`, `/dashboard/` — also map to signalement app

### Authentication

- Custom user model: `accounts.CustomUser` (extends `AbstractUser`)
- Login field: **email** (not username)
- JWT via `djangorestframework_simplejwt` + djoser; access token: 60 min, refresh: 1 day
- `is_verified` flag — agents verify citizen accounts
- CIN front/back images uploaded to `media/cin_images/`
- Password: min 10 chars + complexity checks

### Dual Frontend

- **`frontend/`** — legacy HTML/CSS/JS, served via `run_frontend.py` on `:5500`
- **`frontend-react/`** — React 19 + TypeScript + Vite (active development); proxies API calls to `:8000`

### Database

PostgreSQL — `kelibia_db`, user `postgres`, password `admin`. Override via `DATABASE_URL` env var.

### Key Config Files

| File | Purpose |
|---|---|
| `core/settings.py` | All Django config: DB, JWT, CORS, email SMTP, installed apps |
| `core/urls.py` | Root URL routing |
| `frontend-react/vite.config.ts` | Proxy rules mapping frontend paths to Django |
| `frontend-react/package.json` | React 19, Vite, react-router-dom v7, Leaflet, react-webcam |
| `vercel.json` | Vercel deployment (Python wsgi.py + static React SPA) |
| `requirements.txt` | 42 Python dependencies (ML libs commented out — too large for Vercel) |

---

## App Details

### `accounts`
- `CustomUser`: `email`, `cin`, `phone`, `address`, `governorate`, `city`, `user_type` (citizen|agent), `is_verified`, `cin_front_image`, `cin_back_image`
- Views: `RegisterView`, `CustomActivationView`, `UserProfileView`, `MyTokenObtainPairView`

### `reclamations`
- `Reclamation`: `citizen`, `agent`, `title`, `description`, `category` (lighting|trash|roads|noise|other), `status` (pending|in_progress|resolved|rejected), `priority` (faible|normale|urgente), `service_responsable`, `image`, `latitude`, `longitude`
- **ML Classifier** (`reclamations/classifier.py`):
  - **ML pipeline** (when scikit-learn available): TF-IDF + LinearSVC, dual models for category + priority, 200+ training examples
  - **Rule-based fallback** (always available, used on Vercel): keyword matching for category + priority
  - Auto-classifies on `perform_create()`; agents can override via `reclassify` action
- Custom ViewSet actions: `classify_preview`, `reclassify`, `update_status`, `ml_stats`

### `forum`
- Models: `Tag`, `Topic`, `Reply`, `Vote` (polymorphic — topic or reply), `Notification`
- Signal: auto-creates `Notification` when reply posted (skips self-replies)
- Actions: `add_reply`, `vote_topic`, `vote_reply`, `pin` (agent), `resolve` (agent)
- Query optimization: `prefetch_related` / `select_related` to prevent N+1

### `services`
- Models: `Category` (FR/AR names + icon), `Service` (FR/AR name/description, processing_time, PDFs), `Requirement` (FR/AR, mandatory flag)

### `extrait_naissance`
- `Citoyen`: bilingual person record with self-referential FKs for parents
- `ExtraitNaissance`: birth cert with UUID, QR code generation
- `DeclarationNaissance`: new birth declaration with CIN scans + signature

### `extrait_mariage`
- `ExtraitMariage`: marriage cert with spouse FKs (`Citoyen`), regime_matrimonial, type_acte
- `DemandeMariage`: marriage request; **signal**: when status → 'signed', auto-creates `ExtraitMariage`

### `attestation_residence`
- `DemandeResidence`: citizen request with CIN recto/verso, motif, `issued_document` (signed PDF)

### `extrait_deces`
- `ExtraitDeces`: death record with `defunt` (FK Citoyen), QR code

### `news`
- `Article`: `author`, `title`, `slug`, `content`, `image`, `is_published`

### `signalement`
- `Complaint`: simpler geo-tagged complaint schema; defaults to Kelibia center (36.8481, 11.0939)

---

## Frontend React (`frontend-react/`)

**Tech**: React 19 + TypeScript, Vite, React Router v7, Leaflet/react-leaflet, react-webcam, Bootstrap 5

**Structure:**
```
src/
├── pages/          # 25+ pages (Login, Dashboard, AgentDashboard, Forum, forms, etc.)
├── components/     # MainLayout, TopNav, Sidebar, HeroSection, ProfileCard
├── i18n/           # LanguageProvider — bilingual FR/AR context
├── lib/            # api.ts (HTTP client), authStorage.ts (JWT), backendUrl.ts
├── styles/         # CSS files
└── types/          # TypeScript interfaces
```

**Key Routes:**

| Route | Page |
|---|---|
| `/login`, `/signup`, `/activate` | Auth flow |
| `/dashboard` | Citizen home |
| `/agent-dashboard` | Agent home |
| `/services` | Bilingual service catalog |
| `/forum`, `/forum/:id` | Forum list + topic detail |
| `/mes-extraits`, `/mes-demandes`, `/mes-deces`, `/mes-mariages`, `/mes-residences` | Citizen document views |
| `/mes-reclamations` | Citizen complaint list |
| `/declaration-naissance`, `/declaration-deces` | New declaration forms |
| `/reclamation-form` | Submit complaint |
| `/demande-residence`, `/mariage-contract` | Request forms |

**Vite proxy rules** (dev only, `vite.config.ts`):
- `/api/*` → `http://localhost:8000`
- `/extrait-*` → `http://localhost:8000`
- `/attestation-residence` → `http://localhost:8000`
- `/media/*` → `http://localhost:8000`

---

## Seed / Test Data

`seed_data.py` creates demo accounts (safe to re-run, idempotent):

| Account | Email | Password |
|---|---|---|
| Superadmin | admin@mairie-kelibia.tn | Admin@Kelibia2025 |
| Agent 1-3 | agent{1-3}@mairie-kelibia.tn | Agent@2025! |
| Citizen 1-12 | citoyen{1-12}@kelibia.tn | Citoyen@2025! |

Also seeds 30 complaints with realistic Kelibia GPS coordinates and varied statuses.

---

## Deployment (Vercel + Neon DB)

- **Production URL**: https://kelibia-smart-city.vercel.app
- Django served via `core/wsgi.py` (Python 3.12 serverless)
- React SPA served from `frontend-react/dist/`
- Database: **Neon PostgreSQL** (serverless Postgres, SSL required)
- ML scikit-learn packages excluded (too large ~200MB) — classifier uses rule-based fallback

### Required Vercel Environment Variables

Set these in the Vercel dashboard → Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-icy-smoke-anav09dn-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `SECRET_KEY` | A long random string (generate with `python -c "import secrets; print(secrets.token_hex(50))"`) |
| `DEBUG` | `False` |
| `DOMAIN` | `kelibia-smart-city.vercel.app` |
| `EMAIL_HOST_USER` | Gmail address for sending emails |
| `EMAIL_HOST_PASSWORD` | Gmail app password |

### How Vercel Routing Works

Routes in `vercel.json` (Django handles):
- `/api/*`, `/admin/*`, `/admin`, `/static/*`, `/media/*`
- `/extrait-naissance/*`, `/extrait-mariage/*`, `/extrait-deces/*`
- `/attestation-residence/*`, `/signalement/*`, `/dashboard/*`

Everything else (`/*`) → React SPA (`/index.html`)

### Deploy

Push to `main` branch → Vercel auto-deploys. Migrations do NOT run automatically — run them manually after schema changes:
```bash
# Set DATABASE_URL locally to Neon connection string, then:
python manage.py migrate
```

---

## Important Notes

- Always activate `.venv` before running Django commands on Windows
- Use `127.0.0.1` not `localhost` for the legacy frontend (SSO breaks)
- ML packages (`scikit-learn`, `nltk`, `joblib`, `numpy`) are commented out in `requirements.txt` — uncomment for local ML training
- Certificate endpoints (`/extrait-naissance/`, etc.) are NOT under `/api/` — this is intentional
- `signalement` app is an alternative/simpler complaint system alongside `reclamations`
- Bilingual models use `_fr` / `_ar` field suffixes for French and Arabic content
