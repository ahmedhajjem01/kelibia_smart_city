# Cahier des Charges — Kelibia Smart City
**Plateforme de Services Municipaux Numériques**
Version 1.0 — Mars 2026

---

## 1. Présentation du Projet

### 1.1 Contexte

La commune de Kélibia (Gouvernorat de Nabeul, Tunisie) souhaite moderniser et numériser ses services administratifs à destination des citoyens. Le projet **Kelibia Smart City** est une plateforme web bilingue (Français / Arabe) permettant aux habitants d'accéder en ligne aux services municipaux, de soumettre des demandes administratives, de signaler des problèmes urbains, et d'échanger sur le forum communautaire — sans avoir à se déplacer à la mairie.

### 1.2 Objectifs Généraux

- Dématérialiser les démarches administratives courantes
- Réduire les délais de traitement des demandes citoyennes
- Améliorer la communication entre les citoyens et les agents municipaux
- Fournir aux agents des outils modernes de gestion et de suivi
- Intégrer l'intelligence artificielle pour l'automatisation de la classification des signalements

### 1.3 Public Cible

| Profil | Description |
|---|---|
| **Citoyens** | Résidents de Kélibia souhaitant accéder aux services en ligne |
| **Agents municipaux** | Personnel de la commune traitant les demandes |
| **Superviseurs** | Responsables ayant accès au panel d'administration complet |

---

## 2. Stack Technique

### 2.1 Backend

| Composant | Technologie | Version |
|---|---|---|
| Framework web | Django | 6.0.2 |
| API REST | Django REST Framework | 3.16.1 |
| Authentification | JWT (simplejwt + djoser) | 5.5.1 / 2.3.3 |
| Base de données | PostgreSQL | — |
| ORM cloud | Neon DB (serverless PostgreSQL) | — |
| Fichiers statiques | WhiteNoise | 6.9.0 |
| Images / Fichiers | Pillow | 10.3.0 |
| QR Codes | qrcode | 7.4.2 |
| ML / NLP | scikit-learn, NLTK, NumPy, joblib | 1.8.0 / 3.9.4 / 2.4.4 / 1.5.3 |
| Auth sociale | social-auth-app-django | 5.7.0 |
| Config DB | dj-database-url | 2.3.0 |

### 2.2 Frontend

| Composant | Technologie | Version |
|---|---|---|
| Framework UI | React | 19.2.4 |
| Langage | TypeScript | ~5.9.3 |
| Build tool | Vite | 8.0.1 |
| Routing | React Router | 7.13.2 |
| Cartographie | Leaflet + react-leaflet | 1.9.4 / 5.0.0 |
| Webcam | react-webcam | 7.2.0 |
| Analytics | Vercel Speed Insights | 2.0.0 |

### 2.3 Infrastructure & Déploiement

| Composant | Technologie |
|---|---|
| Hébergement | Vercel (serverless) |
| Base de données production | Neon PostgreSQL (SSL) |
| CI/CD | GitHub → Vercel (auto-deploy sur push `main`) |
| URL production | https://kelibia-smart-city.vercel.app |
| Runtime Python | Python 3.12 |

---

## 3. Architecture du Système

### 3.1 Applications Django

| App | Rôle |
|---|---|
| `accounts` | Gestion des utilisateurs, JWT, upload CIN |
| `extrait_naissance` | Extraits de naissance + déclarations |
| `extrait_mariage` | Extraits de mariage + demandes de contrat |
| `extrait_deces` | Extraits de décès + déclarations + inhumations |
| `attestation_residence` | Attestations de résidence |
| `reclamations` | Signalements citoyens avec classification ML |
| `forum` | Forum communautaire (sujets, réponses, votes) |
| `news` | Actualités et annonces municipales |
| `signalement` | Système alternatif de signalements géolocalisés |
| `services` | Catalogue bilingue de services municipaux |

### 3.2 Structure des URLs

```
/admin/                          → Panel Django Admin
/api/token/                      → Authentification JWT
/api/accounts/                   → Profil, inscription, activation
/api/reclamations/               → Signalements
/api/forum/                      → Forum
/api/news/                       → Actualités
/api/services/                   → Catalogue services
/api/residence/                  → Attestations résidence
/api/signalement/                → Signalements géolocalisés
/extrait-naissance/              → Extraits naissance (hors /api/)
/extrait-mariage/                → Extraits mariage (hors /api/)
/extrait-deces/                  → Extraits décès (hors /api/)
/*                               → React SPA (index.html)
```

### 3.3 Modèle de Données Principal

**Utilisateur (`CustomUser`)**
```
email (identifiant), CIN, téléphone, adresse, gouvernorat, ville
user_type : citizen | agent | supervisor
is_verified, cin_front_image, cin_back_image
```

**Signalement (`Reclamation`)**
```
titre, description, catégorie (éclairage|déchets|voirie|nuisances|autre)
statut (en_attente|en_cours|résolu|rejeté)
priorité (faible|normale|urgente) — assignée par l'IA
service_responsable — assigné automatiquement
image, latitude, longitude, confiance_ia
```

---

## 4. Fonctionnalités Réalisées

### 4.1 Authentification & Comptes

- [x] Inscription par email avec vérification par lien d'activation
- [x] Connexion JWT (access 60 min, refresh 1 jour)
- [x] Déconnexion et nettoyage des tokens
- [x] Réinitialisation de mot de passe par email
- [x] Upload des photos recto/verso de la CIN
- [x] Rôles : `citizen`, `agent`, `supervisor`
- [x] Page de connexion redesignée (thème sombre moderne)

### 4.2 État Civil (partenaire)

- [x] **Extrait de naissance** : consultation, déclaration, certificat PDF avec QR code
- [x] **Extrait de mariage** : consultation, demande de contrat, signature agent
- [x] **Extrait de décès** : consultation, déclaration, demande d'inhumation
- [x] Vérification par QR code (UUID unique par document)
- [x] Documents bilingues Arabe / Français

### 4.3 Attestation de Résidence

- [x] Formulaire de demande avec upload CIN recto/verso
- [x] Motif de la demande
- [x] Traitement par agent (approbation / rejet)
- [x] Document signé uploadé par l'agent

### 4.4 Signalements & Réclamations (IA)

- [x] Formulaire de dépôt de signalement avec photo et géolocalisation
- [x] **Classificateur ML/NLP** (TF-IDF + LinearSVC) :
  - Catégorie automatique (éclairage, déchets, voirie, nuisances, autre)
  - Priorité automatique (faible, normale, urgente)
  - Service responsable assigné automatiquement
  - Score de confiance IA affiché à l'agent
- [x] Entraînement en mémoire sur Vercel (filesystem read-only)
- [x] Reclassification manuelle par l'agent
- [x] Suivi du statut en temps réel
- [x] Détection de doublons

### 4.5 Espace Agent

- [x] Tableau de bord avec statistiques (total, en attente, en cours, résolus, rejetés, doublons)
- [x] Carte SIG interactive (Leaflet) avec 3 couches (OSM, Satellite, Topographique)
- [x] Filtres avancés (statut, catégorie, priorité, recherche textuelle)
- [x] Mise à jour rapide du statut depuis la liste
- [x] Modal de détail avec historique et correction IA
- [x] Sidebar sticky (toujours visible au scroll)
- [x] **Page Stats IA** (`/agent-stats`) :
  - Tableau 1 : Rapport de classification (catégorie)
  - Tableau 2 : Matrice de confusion (catégorie)
  - Tableau 3 : Mots-clés discriminatifs NLP par catégorie
  - Tableau 4 : Rapport de classification (priorité)
  - Tableau 4b : Matrice de confusion (priorité)

### 4.6 Forum Communautaire

- [x] Liste des sujets avec filtres par catégorie et tags
- [x] Création de sujets (questions, suggestions, débats)
- [x] Système de réponses imbriquées
- [x] Votes sur sujets et réponses
- [x] Notifications automatiques (signal Django)
- [x] Actions agent : épingler, marquer comme résolu

### 4.7 Catalogue de Services

- [x] Catalogue bilingue FR/AR avec icônes
- [x] Catégories, descriptions, délais de traitement
- [x] Liste des pièces justificatives requises

### 4.8 Localisation Bilingue

- [x] Interface complète en Français et Arabe
- [x] Contexte React `LanguageProvider` (i18n)
- [x] Modèles Django avec champs `_fr` / `_ar`
- [x] Support RTL pour l'arabe

### 4.9 Déploiement Production

- [x] Migration de la base de données vers **Neon PostgreSQL** (cloud)
- [x] Déploiement sur **Vercel** avec routage Django + React SPA
- [x] Variables d'environnement sécurisées (`.env`, `.env.example`)
- [x] CI/CD automatique via GitHub → Vercel

---

## 5. Fonctionnalités à Développer

### 5.1 Services Municipaux (Phase 2)

Ces 5 catégories de services sont à implémenter entièrement (React + Django) :

#### 5.1.1 Social & Événements
- Calendrier des événements municipaux
- Demandes d'aide sociale (formulaire + pièces justificatives)
- Annonces communautaires

#### 5.1.2 Maison & Construction
- Demande de permis de construire / rénover
- Déclaration de travaux
- Consultation du cadastre
- Documents de propriété

#### 5.1.3 Argent & Impôts
- Consultation du solde des taxes municipales
- Récépissés de paiement
- Demande d'échelonnement
- Avis d'imposition

#### 5.1.4 Boutiques & Commerces
- Demande de licence commerciale
- Enregistrement d'une activité
- Attribution de place de marché
- Renouvellement annuel

#### 5.1.5 Eau, Lumière et Égouts
- Demande de raccordement eau / électricité
- Signalement de coupure ou fuite
- Relevé de compteur
- Facturation consultation

**Pour chaque service :**
1. Modèle Django + serializer + viewset
2. Migration base de données
3. Page formulaire React (citoyen)
4. Page de gestion React (agent)
5. Route dans `App.tsx` et `core/urls.py`

### 5.2 Pages Manquantes

| Page | Priorité | Notes |
|---|---|---|
| **Actualités** (citoyen) | Haute | Backend `news` app existant, page React à créer |
| **Mon Profil** (citoyen) | Haute | Édition nom, téléphone, adresse, photo |
| **Mon Profil** (agent) | Haute | Idem + statistiques personnelles |
| **Page d'accueil publique** | Moyenne | Landing page avant connexion |
| **Inscription** (redesign) | Moyenne | Aligner avec le nouveau thème sombre du login |

### 5.3 Améliorations Techniques

| Amélioration | Description |
|---|---|
| Notifications push | Alertes temps réel pour les changements de statut |
| Export PDF | Génération de récapitulatifs de demandes |
| Recherche globale | Barre de recherche unifiée sur tous les services |
| PWA | Mode hors-ligne et installation mobile |
| Tests automatisés | Couverture des APIs critiques (Django `TestCase`) |
| Pagination API | Toutes les listes paginées côté backend |

---

## 6. Sécurité

- Authentification JWT avec expiration courte (60 min)
- Mots de passe : minimum 10 caractères + règles de complexité
- Upload CIN stocké en `media/cin_images/` (accès restreint)
- CORS configuré : seuls les domaines autorisés acceptés
- Variables sensibles dans les variables d'environnement Vercel (jamais dans le code)
- `.env` exclu du dépôt Git (`.gitignore`)
- SSL obligatoire sur Neon DB (`sslmode=require`)

---

## 7. Variables d'Environnement (Production)

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion Neon PostgreSQL |
| `SECRET_KEY` | Clé secrète Django |
| `DEBUG` | `False` en production |
| `DOMAIN` | `kelibia-smart-city.vercel.app` |
| `EMAIL_HOST_USER` | Adresse Gmail pour l'envoi des emails |
| `EMAIL_HOST_PASSWORD` | Mot de passe d'application Gmail |

---

## 8. Comptes de Test

| Rôle | Email | Mot de passe |
|---|---|---|
| Superadmin | admin@mairie-kelibia.tn | Admin@Kelibia2025 |
| Agent 1–3 | agent{1-3}@mairie-kelibia.tn | Agent@2025! |
| Citoyen 1–12 | citoyen{1-12}@kelibia.tn | Citoyen@2025! |

---

## 9. Équipe & Répartition

| Membre | Responsabilité |
|---|---|
| **Ahmed Hajjem** | Backend Django, ML/NLP, Espace Agent, Déploiement Vercel/Neon, Services Phase 2 |
| **Partenaire** | État Civil (naissance, mariage, décès), Frontend React pages |

---

## 10. Liens Utiles

| Ressource | URL |
|---|---|
| Application production | https://kelibia-smart-city.vercel.app |
| Panel Django Admin | https://kelibia-smart-city.vercel.app/admin/ |
| Dépôt GitHub | https://github.com/ahmedhajjem01/kelibia_smart_city |
| Dashboard Vercel | https://vercel.com/dashboard |
| Console Neon DB | https://console.neon.tech |

---

*Document rédigé le 30 mars 2026 — Kelibia Smart City v1.0*
