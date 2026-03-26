# -*- coding: utf-8 -*-
"""
Classificateur automatique de priorité et catégorie pour les réclamations.
Utilise une approche par mots-clés (règles métier).
"""

# ── Mots-clés pour la priorité ─────────────────────────────────
PRIORITY_RULES = {
    'urgente': [
        'danger', 'urgent', 'urgence', 'accident', 'blessé', 'blessure',
        'fuite', 'fuite gaz', 'fuite eau', 'inondation', 'effondrement',
        'électrique', 'choc', 'incendie', 'feu', 'bloqué', 'coupure',
        'panne totale', 'explosion', 'affaissement', 'câble', 'fil électrique',
        'danger immédiat', 'enfant', 'blessé', 'sang', 'ambulance',
    ],
    'normale': [
        'route', 'trou', 'chaussée', 'nid de poule', 'poubelle', 'déchet',
        'ordures', 'lampe', 'lampadaire', 'éclairage', 'lumière', 'eau',
        'canalisation', 'arbre', 'fissure', 'dégradé', 'cassé', 'abîmé',
        'signalement', 'problème', 'mauvais état', 'réparation',
    ],
    'faible': [
        'esthétique', 'peinture', 'tag', 'graffiti', 'bruit', 'herbe',
        'végétation', 'saleté légère', 'mauvaise odeur', 'suggestion',
        'amélioration', 'demande', 'signalisation', 'trottoir',
    ],
}

# ── Mots-clés pour la catégorie ────────────────────────────────
CATEGORY_RULES = {
    'lighting': [
        'lampe', 'lampadaire', 'éclairage', 'lumière', 'luminaire',
        'électrique', 'panne lumière', 'ampoule', 'néon', 'projecteur',
    ],
    'trash': [
        'poubelle', 'déchet', 'ordures', 'saleté', 'hygiène', 'insalubrité',
        'déchets sauvages', 'dépôt sauvage', 'ramassage', 'propreté',
        'éboueurs', 'collecte',
    ],
    'roads': [
        'route', 'trou', 'chaussée', 'nid de poule', 'voirie', 'asphalte',
        'bitume', 'affaissement', 'fissure', 'trottoir', 'signalisation',
        'marquage', 'route endommagée', 'route dégradée',
    ],
    'noise': [
        'bruit', 'nuisance sonore', 'tapage', 'klaxon', 'musique',
        'voisin', 'nuisance', 'son', 'vacarme', 'dérangement',
    ],
}

# ── Mapping catégorie → service responsable ────────────────────
SERVICE_MAP = {
    'lighting': 'Service Éclairage Public',
    'trash':    'Service Hygiène & Propreté',
    'roads':    'Service Voirie & Infrastructure',
    'noise':    'Service Ordre & Tranquillité',
    'other':    'Service Technique Général',
}


def classify_priority(text: str) -> str:
    """
    Retourne 'urgente', 'normale', ou 'faible' selon le contenu du texte.
    """
    text_lower = text.lower()
    for priority in ('urgente', 'normale', 'faible'):
        for keyword in PRIORITY_RULES[priority]:
            if keyword in text_lower:
                return priority
    return 'normale'  # Par défaut


def classify_category(text: str, current_category: str = 'other') -> str:
    """
    Tente de raffiner la catégorie à partir du texte.
    Si aucun mot-clé trouvé, retourne la catégorie courante.
    """
    text_lower = text.lower()
    for cat, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            if keyword in text_lower:
                return cat
    return current_category


def get_service(category: str) -> str:
    """Retourne le service responsable selon la catégorie."""
    return SERVICE_MAP.get(category, 'Service Technique Général')


def classify(title: str, description: str, category: str = 'other') -> dict:
    """
    Fonction principale — retourne un dict avec:
      - priority : 'urgente' | 'normale' | 'faible'
      - category : catégorie affinée
      - service_responsable : service en charge
    """
    full_text = f"{title} {description}"
    priority  = classify_priority(full_text)
    cat       = classify_category(full_text, category)
    service   = get_service(cat)
    return {
        'priority':           priority,
        'category':           cat,
        'service_responsable': service,
    }
