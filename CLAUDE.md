# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kelibia Smart City** — a bilingual (French/Arabic) citizen services platform for the municipality of Kelibia, Tunisia.

Citizens can:
- Request civil documents (birth/marriage/death certificates, residence attestations)
- Submit and track complaints (auto-classified by ML)
- Use the community forum
- View municipal news/announcements

Three user roles: `citizen`, `agent` (municipal agent), and `supervisor` (administrator).

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
| `accounts` | Custom user model (`CustomUser`), JWT auth, CIN image upload, agent verification, supervisor management |
| `reclamations` | Citizen complaints with ML/NLP auto-classification (10 categories + priority + duplicate detection) |
| `forum` | Community forum — topics, replies, votes, notifications |
| `services` | Bilingual service catalog (FR/AR categories, descriptions, requirements) |
| `extrait_naissance` | Birth certificate records + citizen declaration requests + legalization requests |
| `extrait_mariage` | Marriage certificate records + marriage requests |
| `extrait_deces` | Death certificate records + declaration requests + inhumation + body transfer |
| `attestation_residence` | Residence attestation requests |
| `livret_famille` | Family booklet requests |
| `news` | Municipal announcements/articles |
| `social_evenements` | Event authorization requests (public/private) with conflict detection |
| `maison_construction` | Building permits, road surfacing requests, property vocation certificates, network connections |
| `eau_lumiere_egouts` | Water, electricity, sewage connection requests and anomaly reports |
| `argent_impots` | Property registration, ownership changes, tax certificates |
| `boutiques_commerces` | Commercial signage license requests |
| `notifications` | System-wide notification model |
| `signalement` | Geo-tagged reports/alerts (legacy simpler schema) |

### URL Structure (`core/urls.py`)

- `/admin/` — Django admin
- `/api/` — djoser auth + JWT endpoints
- `/api/token/` — JWT login (`MyTokenObtainPairView`)
- `/api/accounts/` — register, activate, profile (`me/`)
- `/api/services/`, `/api/reclamations/`, `/api/news/`, `/api/forum/`, `/api/residence/`, `/api/signalement/`
- `/api/evenements/` — event authorizations
- `/api/construction/` — building permits, road surfacing, property vocation, network connections
- `/api/eau/` — water/electricity/sewage requests
- `/api/impots/` — tax and property services
- `/api/commerce/` — commercial services
- `/api/notifications/` — notification management
- `/api/supervisor/services-summary/` — supervisor aggregate dashboard
- `/api/supervisor/manage-orders/` — centralized order management for supervisors
- `/extrait-naissance/`, `/extrait-mariage/`, `/extrait-deces/` — certificate endpoints (NOT under `/api/`)
- `/livret-famille/` — family booklet endpoints
- `/signalement/`, `/dashboard/` — also map to signalement app

### Authentication

- Custom user model: `accounts.CustomUser` (extends `AbstractUser`)
- Login field: **email** (not username)
- JWT via `djangorestframework_simplejwt` + djoser; access token: 60 min, refresh: 1 day
- `is_verified` flag — agents verify citizen accounts
- `user_type`: `citizen` | `agent` | `supervisor`
- `assigned_service` for agents: 14 service types (lighting, trash, roads, noise, water, construction, social, commerce, taxes, civil_registry, residence, forum_moderator, news_editor, general)
- Arabic name fields: `first_name_ar`, `last_name_ar`
- Additional fields: `date_of_birth`, `place_of_birth`, `is_married`, `spouse_*`, `preferred_language`, `asd_active` (subscription)
- CIN front/back images stored as Base64 in `cin_front_image`/`cin_back_image` (and `cin_front_utf`/`cin_back_utf`)
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
- `CustomUser`: `email`, `cin`, `phone`, `address`, `governorate`, `city`, `user_type` (citizen|agent|supervisor), `is_verified`, `cin_front_image`, `cin_back_image`, `first_name_ar`, `last_name_ar`, `date_of_birth`, `place_of_birth`, `is_married`, `spouse_cin/first_name/last_name`, `preferred_language`, `assigned_service`, `asd_active`, `asd_expiration`
- `SavedCard`: payment card storage (card_holder, last_4, expiry, brand)
- `SiteConfiguration`: global site settings
- Views: `RegisterView`, `CustomActivationView`, `UserProfileView`, `MyTokenObtainPairView`

### `reclamations`
- `Reclamation`: `citizen`, `agent`, `title`, `description`, `category` (lighting|trash|roads|noise|water|construction|social|commerce|taxes|other), `status` (pending|in_progress|resolved|rejected), `priority` (faible|normale|urgente), `service_responsable`, `image`, `latitude`, `longitude`, `is_duplicate`, `duplicate_of`, `similarity_score`
- **ML Classifier** (`reclamations/classifier.py`):
  - **ML pipeline**: TF-IDF (unigrams+bigrams) + LinearSVC (via CalibratedClassifierCV), dual models for category (10 classes) + priority (3 classes), 601 training examples
  - **Duplicate detection**: cosine similarity (TF-IDF, 60%) + Haversine distance (40%), threshold 0.65
  - **XAI explanations**: LIME + SHAP for word-level feature importance
  - **Rule-based fallback** (always available, used when scikit-learn unavailable): keyword matching
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
- `DeclarationDeces`: new death declaration; signal auto-creates `ExtraitDeces` on validation
- `DemandeInhumation`: burial request linked to `DeclarationDeces`
- `DemandeTransfertCorps`: body transfer request with medical cert + CIN

### `livret_famille`
- `DemandeLivretFamille`: family booklet request; supports first issuance, renewal, duplicate; requires marriage/birth extracts

### `news`
- `Article`: `author`, `title`, `slug`, `content`, `image`, `is_published`
- `ArticleImage`: additional images for an article

### `social_evenements`
- `DemandeEvenement`: public/private event authorization request with conflict detection (`detect_conflict()`); fields for organizer, dates, location, required documents, `autorisation_signee`

### `maison_construction`
- `DemandeConstruction`: building permit with risk scoring (`compute_risk()` flags demolitions and 3+ story buildings); `permis_signe`
- `DemandeGoudronnage`: road surfacing request
- `DemandeCertificatVocation`: property use certificate; `certificat_signe`
- `DemandeRaccordement`: utility connection (eau|electricite|assainissement); `devis_pdf`, `date_visite`

### `eau_lumiere_egouts`
- `DemandeEau`: unified water/electricity/sewage request and anomaly report; `issued_document`

### `argent_impots`
- `DemandeImpot`: property registration, ownership/use changes, tax certificates; `issued_document`

### `boutiques_commerces`
- `DemandeCommerce`: commercial signage license; `issued_document`

### `notifications`
- `Notification`: system-wide notifications (info|success|warning|error) with `link` and `is_read`

### `signalement`
- `Complaint`: legacy simpler geo-tagged complaint schema; defaults to Kelibia center (36.8481, 11.0939)

---

## Frontend React (`frontend-react/`)

**Tech**: React 19 + TypeScript, Vite, React Router v7, Leaflet/react-leaflet, react-webcam, Bootstrap 5

**Structure:**
```
src/
├── pages/          # 48 pages (Login, Dashboard, AgentDashboard, Forum, forms, etc.)
├── components/     # MainLayout, TopNav, Sidebar, HeroSection, ProfileCard
├── i18n/           # LanguageProvider — bilingual FR/AR context (400+ translation keys)
├── lib/            # api.ts (HTTP client), authStorage.ts (JWT), backendUrl.ts
├── styles/         # CSS files
└── types/          # TypeScript interfaces
```

**Key Routes:**

| Route | Page |
|---|---|
| `/login`, `/signup`, `/activate` | Auth flow |
| `/forgot-password`, `/reset-password-confirm` | Password reset |
| `/dashboard` | Citizen home |
| `/agent-dashboard` | Agent home |
| `/profile` | User profile |
| `/services`, `/news` | Service catalog + municipal news |
| `/forum`, `/forum/:id` | Forum list + topic detail |
| `/mes-extraits`, `/mes-naissances`, `/mes-demandes`, `/mes-deces`, `/mes-mariages`, `/mes-residences` | Citizen document views |
| `/mes-reclamations` | Citizen complaint list |
| `/declaration-naissance`, `/declaration-deces` | New declaration forms |
| `/nouvelle-reclamation` | Submit complaint |
| `/demande-residence`, `/demande-mariage` | Request forms |
| `/demande-evenement`, `/demande-evenement-public`, `/demande-evenement-prive`, `/mes-evenements`, `/evenements` | Events |
| `/demande-construction`, `/demande-goudronnage`, `/demande-certificat-vocation`, `/demande-raccordement`, `/mes-constructions` | Construction services |
| `/demande-inhumation`, `/demande-transfert-corps`, `/demande-legalisation` | Death-related services |
| `/demande-livret-famille` | Family booklet |
| `/demande-bien`, `/demande-propriete-changement`, `/demande-vocation-changement`, `/mes-impots` | Property/tax services |
| `/demande-eau`, `/mes-eau` | Water/utility services |
| `/demande-commerce`, `/mes-commerce` | Commercial services |
| `/paiement` | Payment simulation |

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
- ML scikit-learn packages **included** in requirements.txt (~81MB total, within Vercel's 250MB limit) — full ML pipeline active in production; rule-based fallback used only if scikit-learn is exceptionally unavailable

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

## Implemented Services (Phase 1 — Complete)

All major citizen services are implemented with React frontend + Django backend:

| Service | App | Status |
|---|---|---|
| **État Civil** (birth, marriage, death, residence, livret) | `extrait_naissance`, `extrait_mariage`, `extrait_deces`, `attestation_residence`, `livret_famille` | ✅ Done |
| **Problèmes & Signalements** | `reclamations` | ✅ Done |
| **Social & Événements** | `social_evenements` | ✅ Done |
| **Maison & Construction** | `maison_construction` | ✅ Done |
| **Argent & Impôts** | `argent_impots` | ✅ Done |
| **Boutiques & Commerces** | `boutiques_commerces` | ✅ Done |
| **Eau, Lumière et Égouts** | `eau_lumiere_egouts` | ✅ Done |

## Pending Features (Phase 2 — Future)

| Feature | Description |
|---|---|
| DGI/SONEDE/STEG integration | Connect to real external government systems |
| Electronic signature | Legal document signing |
| Real payment gateway | Tunisian banking integration |
| Push notifications + PWA | Real-time alerts + offline support |
| Automated tests | Unit + end-to-end test suites |
| Arabic NLP improvement | Better ML classification for Arabic text |

---

## Important Notes

- Always activate `.venv` before running Django commands on Windows
- Use `127.0.0.1` not `localhost` for the legacy frontend (SSO breaks)
- ML packages (`scikit-learn`, `nltk`, `joblib`, `numpy`, `lime`) are **included** in `requirements.txt` and active in production
- Certificate endpoints (`/extrait-naissance/`, etc.) are NOT under `/api/` — this is intentional
- `signalement` app is a legacy simpler complaint system; `reclamations` is the primary one
- Bilingual models use `_fr` / `_ar` field suffixes for French and Arabic content
- Agent `assigned_service` field controls RBAC — agents only see requests for their assigned service
- `seed_news.py`, `update_social_services.py`, `test_services_api.py` contain hardcoded DB credentials — do not commit to public repos
