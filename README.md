# 🏙️ Kelibia Smart City - Guide d'Installation

Ce guide est destiné à votre binôme pour installer et exécuter le projet sur une nouvelle machine.

## 📋 Prérequis
1.  **Python 3.10+** installé.
2.  **PostgreSQL** installé et en cours d'exécution.
3.  **Git** installé.

## 🚀 Étapes d'Installation

### 1. Cloner le Projet
```bash
git clone https://github.com/ahmedhajjem01/kelibia_smart_city.git
cd kelibia_smart_city
```

### 2. Créer l'Environnement Virtuel
```bash
python -m venv .venv
# Activer sur Windows:
.\.venv\Scripts\activate
```

### 3. Installer les Dépendances
```bash
pip install -r requirements.txt
```

### 4. Configurer la Base de Données
1.  Ouvrez **pgAdmin** ou votre terminal PostgreSQL.
2.  Créez une base de données nommée : `kelibia_db`.
    > [!IMPORTANT]
    > Assurez-vous que l'utilisateur `postgres` a le mot de passe `admin` (comme configuré dans `settings.py`). Sinon, modifiez la section `DATABASES` dans `core/settings.py`.

### 5. Initialiser la Base de Données
```bash
python manage.py migrate
```

### 6. (Optionnel) Créer un Super Utilisateur
```bash
python recreate_superuser.py
```

## 🏁 Lancer le Projet
Double-cliquez sur le fichier :
👉 **`start_dev.bat`**

Cela lancera automatiquement :
-   Le **Backend** : http://127.0.0.1:8000
-   Le **Frontend** : http://localhost:5500/login.html

---
**Note sur l'OTP SMS**: Pour recevoir les SMS sur votre téléphone, assurez-vous de configurer votre propre `INFOBIP_API_KEY` dans `settings.py` ou de vérifier votre numéro sur le portail Infobip.
