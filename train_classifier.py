"""
train_classifier.py — Standalone model training script
=======================================================
Run this from the project root:
    python train_classifier.py

What it does:
  1. Loads training data from reclamations/training_data.py
  2. Trains Category model  (LinearSVC + TF-IDF)
  3. Trains Priority model  (LinearSVC + TF-IDF)
  4. Saves models to reclamations/ml_models/
  5. Prints cross-validation accuracy and a quick test

Re-run whenever you add new training examples.
"""

import os
import sys
import django

# Setup Django (needed for relative imports inside the classifier)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from reclamations.classifier import train, classify, _normalize
from reclamations.training_data import TRAINING_DATA

from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
import numpy as np


def main():
    print("=" * 60)
    print("  Kelibia Smart City — ML Classifier Training")
    print("=" * 60)

    # ── 1. Train both models ────────────────────────────────────────
    results = train(force=True)

    print()
    print("=" * 60)
    print("  Cross-Validation Summary")
    print("=" * 60)
    print("  Category model accuracy : %.1f%%" % (results["category_accuracy"] * 100))
    print("  Priority model accuracy : %.1f%%" % (results["priority_accuracy"] * 100))
    print("  Total training samples  : %d" % results["n_samples"])

    # ── 2. Classification report (hold-out) ─────────────────────────
    texts      = [_normalize(t) for t, _, _ in TRAINING_DATA]
    categories = [c for _, c, _ in TRAINING_DATA]
    priorities = [p for _, _, p in TRAINING_DATA]

    from reclamations.classifier import _load_models
    cat_model, prio_model = _load_models()

    X_tr, X_te, y_cat_tr, y_cat_te, y_prio_tr, y_prio_te = train_test_split(
        texts, categories, priorities, test_size=0.2, random_state=42, stratify=categories
    )

    print()
    print("=" * 60)
    print("  Category Classification Report (20% hold-out)")
    print("=" * 60)
    cat_preds = cat_model.predict(X_te)
    print(classification_report(y_cat_te, cat_preds, zero_division=0))

    print("=" * 60)
    print("  Priority Classification Report (20% hold-out)")
    print("=" * 60)
    prio_preds = prio_model.predict(X_te)
    print(classification_report(y_prio_te, prio_preds, zero_division=0))

    # ── 3. Live inference tests ─────────────────────────────────────
    print("=" * 60)
    print("  Live Inference Tests")
    print("=" * 60)
    test_cases = [
        ("Lampadaire cassé rue Ibn Khaldoun",    "La lumière est éteinte depuis 3 jours",       "lighting"),
        ("Fuite de gaz dans le quartier",        "Odeur forte de gaz, danger explosion possible", "other"),
        ("Poubelles non vidées",                 "Les ordures débordent depuis une semaine",     "trash"),
        ("Nid de poule sur la route principale", "Trou profond cause des accidents",             "roads"),
        ("Voisin fait du bruit la nuit",         "Musique forte jusqu'à 3h du matin",            "noise"),
        ("Suggestion : bancs dans le parc",      "Ce serait bien d'ajouter des bancs",           "other"),
        ("النور مطفي في الشارع",                 "Eclairage en panne",                           "other"),
    ]

    for title, desc, hint in test_cases:
        res = classify(title, desc, hint)
        cat_conf  = res["confidence"]["category"]
        prio_conf = res["confidence"]["priority"]
        print(
            "  [%s | %s]  cat=%-10s(%.0f%%)  prio=%-8s(%.0f%%)"
            % (
                res["category"].upper()[:9],
                res["priority"].upper()[:7],
                res["category"],
                cat_conf * 100,
                res["priority"],
                prio_conf * 100,
            )
        )
        title_safe = title[:60].encode("ascii", errors="replace").decode("ascii")
        print("    Title  : %s" % title_safe)
        print("    Service: %s" % res["service_responsable"])
        print()

    print("=" * 60)
    print("  Training complete! Models ready for production.")
    print("=" * 60)


if __name__ == "__main__":
    main()
