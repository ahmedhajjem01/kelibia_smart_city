"""
classifier.py  —  ML/NLP Classifier for Reclamations
======================================================
Architecture:
  • NLP pipeline  : lowercase → accent removal → stopword filter → French stemmer → TF-IDF (unigrams + bigrams)
  • Category model: LinearSVC with probability calibration (multi-class, 5 categories)
  • Priority model: LinearSVC with probability calibration (3-class: urgente / normale / faible)
  • Persistence   : joblib, saved in reclamations/ml_models/

PRODUCTION NOTE (Vercel):
  scikit-learn + numpy + nltk = ~200MB which exceeds Vercel's 250MB limit.
  If ML packages are not available, the classifier automatically falls back
  to a deterministic rule-based system so the app keeps working on Vercel.
"""

import os
import re
import logging
import unicodedata

logger = logging.getLogger(__name__)

# ─── Try to import ML packages (optional) ────────────────────────────────────
try:
    import joblib
    import numpy as np
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem.snowball import FrenchStemmer
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.svm import LinearSVC
    from sklearn.calibration import CalibratedClassifierCV
    from sklearn.model_selection import cross_val_score
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    logger.warning("ML packages not available — using rule-based fallback classifier.")

# ─── Paths ────────────────────────────────────────────────────────────────────
_THIS_DIR   = os.path.dirname(os.path.abspath(__file__))
_MODEL_DIR  = os.path.join(_THIS_DIR, "ml_models")
_CAT_MODEL  = os.path.join(_MODEL_DIR, "category_model.joblib")
_PRIO_MODEL = os.path.join(_MODEL_DIR, "priority_model.joblib")

if ML_AVAILABLE:
    os.makedirs(_MODEL_DIR, exist_ok=True)

# ─── Singleton cache ──────────────────────────────────────────────────────────
_category_model = None
_priority_model = None

# ─── Service map ─────────────────────────────────────────────────────────────
SERVICE_MAP = {
    "lighting": "Service Eclairage Public",
    "trash":    "Service Hygiene & Proprete",
    "roads":    "Service Voirie & Infrastructure",
    "noise":    "Service Ordre & Tranquillite",
    "other":    "Service Technique General",
}

# ══════════════════════════════════════════════════════════════════════════════
#  RULE-BASED FALLBACK (always available, no dependencies)
# ══════════════════════════════════════════════════════════════════════════════
_PRIORITY_RULES = {
    'urgente': [
        'danger', 'urgent', 'urgence', 'accident', 'blesse', 'blessure',
        'fuite gaz', 'inondation', 'effondrement', 'electrique', 'choc',
        'incendie', 'feu', 'explosion', 'cable', 'fil electrique',
        'risque', 'sang', 'ambulance', 'catastrophe',
    ],
    'faible': [
        'esthetique', 'peinture', 'tag', 'graffiti', 'suggestion',
        'amelioration', 'vegetation', 'saleté légère', 'decoration',
    ],
}
_CATEGORY_RULES = {
    'lighting': [
        'lampe', 'lampadaire', 'eclairage', 'lumiere', 'luminaire',
        'ampoule', 'neon', 'projecteur', 'panne lumiere', 'electricite',
    ],
    'trash': [
        'poubelle', 'dechet', 'ordures', 'salissure', 'hygiene', 'insalubrite',
        'depôt sauvage', 'ramassage', 'proprete', 'eboueurs', 'collecte',
    ],
    'roads': [
        'route', 'trou', 'chaussee', 'nid de poule', 'voirie', 'asphalte',
        'bitume', 'affaissement', 'fissure', 'trottoir', 'signalisation', 'marquage',
    ],
    'noise': [
        'bruit', 'nuisance sonore', 'tapage', 'klaxon', 'musique',
        'voisin', 'vacarme', 'son fort',
    ],
}

def _rule_based_classify(title: str, description: str, category: str = 'other') -> dict:
    """Pure rule-based classifier — no ML dependencies needed."""
    text = (title + ' ' + description).lower()
    # Remove accents for matching
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')

    # Priority
    priority = 'normale'
    for prio_key in ('urgente', 'faible'):
        for kw in _PRIORITY_RULES[prio_key]:
            if kw in text:
                priority = prio_key
                break
        if priority != 'normale':
            break

    # Category
    detected_cat = category if category else 'other'
    for cat_key, keywords in _CATEGORY_RULES.items():
        for kw in keywords:
            if kw in text:
                detected_cat = cat_key
                break
        if detected_cat != (category or 'other'):
            break

    return {
        'priority':            priority,
        'category':            detected_cat,
        'service_responsable': SERVICE_MAP.get(detected_cat, SERVICE_MAP['other']),
        'confidence':          {'category': None, 'priority': None},
    }


# ══════════════════════════════════════════════════════════════════════════════
#  ML PIPELINE (only used when scikit-learn / nltk / joblib are available)
# ══════════════════════════════════════════════════════════════════════════════
if ML_AVAILABLE:
    def _download_nltk_data():
        for pkg in ["stopwords", "punkt"]:
            try:
                nltk.data.find(
                    "corpora/" + pkg if pkg == "stopwords" else "tokenizers/" + pkg
                )
            except LookupError:
                try:
                    nltk.download(pkg, quiet=True)
                except Exception:
                    pass

    _download_nltk_data()
    _stemmer = FrenchStemmer()

    try:
        _FR_STOPWORDS = set(stopwords.words("french"))
    except Exception:
        _FR_STOPWORDS = set()

    _EXTRA_STOP = {
        "rue", "quartier", "zone", "ville", "kelibia", "depuis",
        "faire", "chez", "tres", "notre", "votre", "leur", "leurs",
        "plus", "moins", "comme", "aussi", "donc", "mais", "pour", "avec",
        "dans", "sur", "par", "il", "ya", "jai", "svp",
        "merci", "bonjour", "probleme", "signaler", "demande",
    }
    _ALL_STOP = _FR_STOPWORDS | _EXTRA_STOP

    def _normalize(text: str) -> str:
        text = text.lower()
        text = unicodedata.normalize("NFD", text)
        text = "".join(c for c in text if unicodedata.category(c) != "Mn")
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        tokens = text.split()
        tokens = [t for t in tokens if t not in _ALL_STOP and len(t) > 1]
        tokens = [_stemmer.stem(t) for t in tokens]
        return " ".join(tokens)

    def _build_pipeline() -> Pipeline:
        tfidf = TfidfVectorizer(
            analyzer="word", ngram_range=(1, 2), min_df=1,
            max_df=0.95, sublinear_tf=True, strip_accents="unicode",
        )
        svc = CalibratedClassifierCV(
            LinearSVC(C=1.0, max_iter=2000, class_weight="balanced"), cv=3,
        )
        return Pipeline([("tfidf", tfidf), ("clf", svc)])

    def train(force: bool = False) -> dict:
        from .training_data import TRAINING_DATA
        texts      = [_normalize(t) for t, _, _ in TRAINING_DATA]
        categories = [c for _, c, _ in TRAINING_DATA]
        priorities = [p for _, _, p in TRAINING_DATA]
        logger.info("Training ML models on %d samples...", len(texts))
        cat_pipe = _build_pipeline()
        cat_cv   = cross_val_score(cat_pipe, texts, categories, cv=5, scoring="accuracy")
        cat_pipe.fit(texts, categories)
        joblib.dump(cat_pipe, _CAT_MODEL)
        print("[ML] Category  CV accuracy : %.1f%% +/- %.1f%%" % (cat_cv.mean() * 100, cat_cv.std() * 100))
        prio_pipe = _build_pipeline()
        prio_cv   = cross_val_score(prio_pipe, texts, priorities, cv=5, scoring="accuracy")
        prio_pipe.fit(texts, priorities)
        joblib.dump(prio_pipe, _PRIO_MODEL)
        print("[ML] Priority  CV accuracy : %.1f%% +/- %.1f%%" % (prio_cv.mean() * 100, prio_cv.std() * 100))
        print("[ML] Models saved to:", _MODEL_DIR)
        return {
            "category_accuracy": float(round(cat_cv.mean(), 4)),
            "priority_accuracy": float(round(prio_cv.mean(), 4)),
            "n_samples": len(texts),
        }

    def _load_models():
        global _category_model, _priority_model
        if _category_model is None or _priority_model is None:
            if not os.path.exists(_CAT_MODEL) or not os.path.exists(_PRIO_MODEL):
                logger.warning("ML models not found — running auto-training...")
                train()
            _category_model = joblib.load(_CAT_MODEL)
            _priority_model = joblib.load(_PRIO_MODEL)
        return _category_model, _priority_model

else:
    # Stubs when ML is unavailable
    def train(force: bool = False) -> dict:
        return {"error": "ML packages not installed"}

    def _normalize(text: str) -> str:
        return text.lower()

    def _load_models():
        return None, None


# ─── Public API ──────────────────────────────────────────────────────────────
def classify(title: str, description: str, category: str = "other") -> dict:
    """
    Main function called by ReclamationViewSet.perform_create().
    Uses ML if available, falls back to rule-based otherwise.
    """
    if not ML_AVAILABLE:
        return _rule_based_classify(title, description, category)

    try:
        cat_model, prio_model = _load_models()
        text_raw  = title + " " + title + " " + description
        text_norm = _normalize(text_raw)

        cat_proba   = cat_model.predict_proba([text_norm])[0]
        cat_classes = cat_model.classes_
        cat_idx     = int(np.argmax(cat_proba))
        cat_pred    = cat_classes[cat_idx]
        cat_conf    = float(cat_proba[cat_idx])
        if cat_conf < 0.40 and category and category != "other":
            cat_pred = category
            cat_conf = 0.0

        prio_proba   = prio_model.predict_proba([text_norm])[0]
        prio_classes = prio_model.classes_
        prio_idx     = int(np.argmax(prio_proba))
        prio_pred    = prio_classes[prio_idx]
        prio_conf    = float(prio_proba[prio_idx])

        service = SERVICE_MAP.get(cat_pred, SERVICE_MAP["other"])
        return {
            "priority":            prio_pred,
            "category":            cat_pred,
            "service_responsable": service,
            "confidence": {
                "category": round(cat_conf, 3),
                "priority": round(prio_conf, 3),
            },
        }
    except Exception as exc:
        logger.error("ML classify failed (%s) — falling back to rules", exc)
        return _rule_based_classify(title, description, category)
