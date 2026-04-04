"""
classifier.py  —  ML/NLP Classifier for Reclamations
======================================================
Architecture:
  • NLP pipeline  : lowercase → accent removal → stopword filter → French stemmer → TF-IDF (unigrams + bigrams)
  • Category model: LinearSVC with probability calibration (multi-class, 5 categories)
  • Priority model: LinearSVC with probability calibration (3-class: urgente / normale / faible)
  • Persistence   : joblib, saved in reclamations/ml_models/

The models are loaded ONCE at startup (lazy singleton).
If saved models don't exist, auto-training is triggered.
"""

import os
import re
import logging
import unicodedata

logger = logging.getLogger(__name__)

# ─── Paths ────────────────────────────────────────────────────────────────────
_THIS_DIR   = os.path.dirname(os.path.abspath(__file__))
_MODEL_DIR  = os.path.join(_THIS_DIR, "ml_models")
_CAT_MODEL  = os.path.join(_MODEL_DIR, "category_model.joblib")
_PRIO_MODEL = os.path.join(_MODEL_DIR, "priority_model.joblib")

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


# ─── NLP utilities ────────────────────────────────────────────────────────────
def _download_nltk_data():
    """Download required NLTK data silently."""
    import nltk
    import os
    nltk_dir = os.path.join(os.environ.get('TEMP', '/tmp'), 'nltk_data')
    os.makedirs(nltk_dir, exist_ok=True)
    if nltk_dir not in nltk.data.path:
        nltk.data.path.append(nltk_dir)
        
    for pkg in ["stopwords", "punkt", "punkt_tab"]:
        try:
            nltk.data.find(
                "corpora/" + pkg if pkg == "stopwords" else "tokenizers/" + pkg
            )
        except LookupError:
            nltk.download(pkg, download_dir=nltk_dir, quiet=True)


def _get_stopwords():
    import nltk
    from nltk.corpus import stopwords
    _download_nltk_data()
    try:
        fr_stop = set(stopwords.words("french"))
    except Exception:
        fr_stop = set()
    
    extra_stop = {
        "rue", "quartier", "zone", "ville", "kelibia", "depuis",
        "faire", "chez", "tres", "notre", "votre", "leur", "leurs",
        "plus", "moins", "comme", "aussi", "donc", "mais", "pour", "avec",
        "dans", "sur", "par", "il", "ya", "jai", "svp",
        "merci", "bonjour", "probleme", "signaler", "demande",
    }
    return fr_stop | extra_stop


def _normalize(text: str) -> str:
    """
    Full NLP preprocessing:
      1. Lowercase
      2. Remove accents (Unicode NFD decomposition)
      3. Keep only letters, digits, spaces  (strips Arabic / special chars)
      4. Tokenize on whitespace
      5. Remove stopwords and very short tokens
      6. French Snowball stemming
    """
    from nltk.stem.snowball import FrenchStemmer
    _stemmer = FrenchStemmer()
    all_stop = _get_stopwords()

    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    tokens = text.split()
    tokens = [t for t in tokens if t not in all_stop and len(t) > 1]
    tokens = [_stemmer.stem(t) for t in tokens]

    return " ".join(tokens)


# ─── Model builder ────────────────────────────────────────────────────────────
def _build_pipeline() -> object:
    """
    TF-IDF (word unigrams + bigrams, sublinear TF) fed into a calibrated LinearSVC.
    CalibratedClassifierCV adds probability output to LinearSVC via isotonic regression.
    """
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.svm import LinearSVC
    from sklearn.calibration import CalibratedClassifierCV

    tfidf = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.95,
        sublinear_tf=True,
        strip_accents="unicode",
    )
    svc = CalibratedClassifierCV(
        LinearSVC(C=1.0, max_iter=2000, class_weight="balanced"),
        cv=3,
    )
    return Pipeline([("tfidf", tfidf), ("clf", svc)])


# ─── Training ────────────────────────────────────────────────────────────────
def train(force: bool = False) -> dict:
    """
    Train (or re-train) both category + priority models from training_data.py.
    Saves .joblib files and returns CV accuracy scores.
    """
    from .training_data import TRAINING_DATA

    from sklearn.model_selection import cross_val_score
    import joblib

    texts      = [_normalize(t) for t, _, _ in TRAINING_DATA]
    categories = [c for _, c, _ in TRAINING_DATA]
    priorities = [p for _, _, p in TRAINING_DATA]

    logger.info("Training ML models on %d samples...", len(texts))

    # Category model
    cat_pipe = _build_pipeline()
    cat_cv   = cross_val_score(cat_pipe, texts, categories, cv=5, scoring="accuracy")
    cat_pipe.fit(texts, categories)
    import joblib
    joblib.dump(cat_pipe, _CAT_MODEL)
    logger.info("Category  CV accuracy: %.3f +/- %.3f", cat_cv.mean(), cat_cv.std())
    print("[ML] Category  CV accuracy : %.1f%% +/- %.1f%%" % (cat_cv.mean() * 100, cat_cv.std() * 100))

    # Priority model
    prio_pipe = _build_pipeline()
    prio_cv   = cross_val_score(prio_pipe, texts, priorities, cv=5, scoring="accuracy")
    prio_pipe.fit(texts, priorities)
    joblib.dump(prio_pipe, _PRIO_MODEL)
    logger.info("Priority  CV accuracy: %.3f +/- %.3f", prio_cv.mean(), prio_cv.std())
    print("[ML] Priority  CV accuracy : %.1f%% +/- %.1f%%" % (prio_cv.mean() * 100, prio_cv.std() * 100))

    print("[ML] Models saved to:", _MODEL_DIR)

    return {
        "category_accuracy": float(round(cat_cv.mean(), 4)),
        "priority_accuracy": float(round(prio_cv.mean(), 4)),
        "n_samples": len(texts),
    }


# ─── Lazy loader ─────────────────────────────────────────────────────────────
def _load_models():
    """Load models from disk if available, otherwise train in memory (Vercel)."""
    global _category_model, _priority_model
    if _category_model is not None and _priority_model is not None:
        return _category_model, _priority_model

    import os
    if os.path.exists(_CAT_MODEL) and os.path.exists(_PRIO_MODEL):
        import joblib
        _category_model = joblib.load(_CAT_MODEL)
        _priority_model = joblib.load(_PRIO_MODEL)
        logger.info("ML models loaded from disk.")
    else:
        # Disk models not found (e.g. Vercel read-only fs) — train in memory
        logger.warning("ML models not on disk — training in memory...")
        _train_in_memory()

    return _category_model, _priority_model


def _train_in_memory():
    """Train models and keep them in memory only (no disk write needed)."""
    global _category_model, _priority_model
    from .training_data import TRAINING_DATA

    texts      = [_normalize(t) for t, _, _ in TRAINING_DATA]
    categories = [c for _, c, _ in TRAINING_DATA]
    priorities = [p for _, _, p in TRAINING_DATA]

    cat_pipe = _build_pipeline()
    cat_pipe.fit(texts, categories)
    _category_model = cat_pipe

    prio_pipe = _build_pipeline()
    prio_pipe.fit(texts, priorities)
    _priority_model = prio_pipe

    logger.info("ML models trained in memory on %d samples.", len(texts))


# ─── Public API ──────────────────────────────────────────────────────────────
def classify(title: str, description: str, category: str = "other") -> dict:
    """
    Main function called by ReclamationViewSet.perform_create().

    Parameters
    ----------
    title       : reclamation title
    description : reclamation full description
    category    : user-supplied category hint (used as fallback)

    Returns
    -------
    dict(priority, category, service_responsable, confidence)
    """
    cat_model, prio_model = _load_models()

    # Double the title for higher weight
    text_raw  = title + " " + title + " " + description
    text_norm = _normalize(text_raw)

    # ── Category prediction ─────────────────────────────────────────────────
    import numpy as np
    try:
        cat_proba   = cat_model.predict_proba([text_norm])[0]
        cat_classes = cat_model.classes_
        cat_idx     = int(np.argmax(cat_proba))
        cat_pred    = cat_classes[cat_idx]
        cat_conf    = float(cat_proba[cat_idx])

        # Low-confidence fallback: trust user hint if provided
        if cat_conf < 0.40 and category and category != "other":
            cat_pred = category
            cat_conf = 0.0
    except Exception as exc:
        logger.error("Category prediction error: %s", exc)
        cat_pred = category if category else "other"
        cat_conf = 0.0

    # ── Priority prediction ─────────────────────────────────────────────────
    try:
        prio_proba   = prio_model.predict_proba([text_norm])[0]
        prio_classes = prio_model.classes_
        prio_idx     = int(np.argmax(prio_proba))
        prio_pred    = prio_classes[prio_idx]
        prio_conf    = float(prio_proba[prio_idx])
    except Exception as exc:
        logger.error("Priority prediction error: %s", exc)
        prio_pred = "normale"
        prio_conf = 0.0

    service = SERVICE_MAP.get(cat_pred, SERVICE_MAP["other"])

    logger.info(
        "[ML] '%s' -> category=%s(%.2f) priority=%s(%.2f)",
        title[:50], cat_pred, cat_conf, prio_pred, prio_conf,
    )

    return {
        "priority":            prio_pred,
        "category":            cat_pred,
        "service_responsable": service,
        "confidence": {
            "category": round(cat_conf, 3),
            "priority": round(prio_conf, 3),
        },
    }


# ─── Duplicate detection ──────────────────────────────────────────────────────


def detect_duplicate(title: str, description: str,
                     latitude: float = None, longitude: float = None,
                     exclude_id: int = None,
                     threshold: float = 0.65) -> dict:
    """
    Détecte si une réclamation est similaire à une réclamation existante en DB.

    Stratégie hybride (texte + géolocalisation) utilisant PostGIS :
      1. Récupère les réclamations existantes (non-rejetées) depuis la DB.
      2. Calcule la similarité cosinus TF-IDF sur titre + description.
      3. Calcule un score géographique via ST_Distance (PostGIS).
      4. Score final = 0.6 × score_texte + 0.4 × score_geo
      5. Si le score final dépasse le seuil, c'est un doublon.
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np
        from django.db import connection
        from reclamations.models import Reclamation

        # ── 1. Fetch existing reclamations from DB ───────────────────────────
        qs = Reclamation.objects.exclude(status='rejected')
        if exclude_id:
            qs = qs.exclude(id=exclude_id)

        existing = list(qs.values('id', 'title', 'description', 'latitude', 'longitude'))

        if not existing:
            return {
                "is_duplicate": False, "duplicate_of": None,
                "similarity_score": 0.0, "geo_score": 0.0, "final_score": 0.0,
            }

        # ── 2. TF-IDF text similarity ────────────────────────────────────────
        new_text       = _normalize(title + " " + description)
        existing_texts = [_normalize(r['title'] + " " + r['description']) for r in existing]
        existing_ids   = [r['id'] for r in existing]

        corpus = existing_texts + [new_text]

        vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
            strip_accents="unicode",
        )
        tfidf_matrix = vectorizer.fit_transform(corpus)

        new_vec      = tfidf_matrix[-1]
        existing_mat = tfidf_matrix[:-1]
        text_scores  = cosine_similarity(new_vec, existing_mat)[0]  # shape (n,)

        # ── 3. Geo scores for each existing reclamation (PostGIS) ────────────
        has_gps = latitude is not None and longitude is not None
        geo_scores = np.zeros(len(existing))

        if has_gps:
            with connection.cursor() as cursor:
                # Calcul des distances en une seule requête spatiale
                query = """
                    SELECT id, ST_Distance(
                        ST_MakePoint(longitude, latitude)::geography,
                        ST_MakePoint(%s, %s)::geography
                    ) as dist_m
                    FROM reclamations_reclamation
                    WHERE status != 'rejected'
                """
                if exclude_id:
                    query += f" AND id != {exclude_id}"
                
                cursor.execute(query, [longitude, latitude])
                dist_map = {row[0]: row[1] for row in cursor.fetchall()}
            
            geo_list = []
            for r in existing:
                dist_m = dist_map.get(r['id'], 1000000)
                if dist_m < 100:     score = 1.0
                elif dist_m < 300:   score = 0.7
                elif dist_m < 500:   score = 0.4
                else:                score = 0.0
                geo_list.append(score)
            geo_scores = np.array(geo_list)

        # ── 4. Combined score ────────────────────────────────────────────────
        if has_gps:
            # Weighted combination: 60% text + 40% geo
            final_scores = 0.6 * text_scores + 0.4 * geo_scores
        else:
            final_scores = text_scores

        # ── 5. Find best match ───────────────────────────────────────────────
        best_idx    = int(np.argmax(final_scores))
        best_final  = float(final_scores[best_idx])
        best_text   = float(text_scores[best_idx])
        best_geo    = float(geo_scores[best_idx])

        if best_final >= threshold:
            logger.info(
                "[DUPLICATE] '%s' → id=%d (text=%.3f geo=%.3f final=%.3f)",
                title[:50], existing_ids[best_idx], best_text, best_geo, best_final,
            )
            return {
                "is_duplicate":     True,
                "duplicate_of":     existing_ids[best_idx],
                "similarity_score": round(best_text,  3),
                "geo_score":        round(best_geo,   3),
                "final_score":      round(best_final, 3),
            }

        return {
            "is_duplicate":     False,
            "duplicate_of":     None,
            "similarity_score": round(best_text,  3),
            "geo_score":        round(best_geo,   3),
            "final_score":      round(best_final, 3),
        }

    except Exception as exc:
        logger.error("[DUPLICATE] Detection failed: %s", exc)
        # Fail silently — never block the creation of a reclamation
        return {
            "is_duplicate": False, "duplicate_of": None,
            "similarity_score": 0.0, "geo_score": 0.0, "final_score": 0.0,
        }
