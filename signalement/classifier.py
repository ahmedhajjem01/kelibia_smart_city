from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

PRIORITY_RULES = {
    "urgente": [
        "danger", "urgent", "accident", "blessé", "fuite", "inondation",
        "effondrement", "électrique", "choc", "incendie", "bloqué", "coupure"
    ],
    "normale": [
        "route", "trou", "chaussée", "poubelle", "déchet", "ordures",
        "lampe", "éclairage", "lumière", "eau", "canalisation", "arbre"
    ],
    "faible": [
        "esthétique", "peinture", "tag", "graffiti", "bruit", "herbe"
    ]
}

CATEGORY_RULES = {
    "voirie": ["route", "trou", "chaussée", "nid", "asphalte", "bitume", "rue", "trottoir"],
    "eclairage": ["lampe", "éclairage", "lumière", "lampadaire", "électricité", "panne"],
    "dechets": ["poubelle", "déchet", "ordures", "dépôt", "sauvage", "propreté"],
    "eau": ["eau", "canalisation", "fuite", "inondation", "égout", "assainissement"],
    "espaces_verts": ["arbre", "herbe", "jardin", "parc", "espace vert", "végétation"],
    "batiments": ["bâtiment", "mur", "toit", "école", "mairie", "infrastructure"],
}

def classify_category(text):
    text = text.lower()
    scores = {cat: 0 for cat in CATEGORY_RULES}
    for cat, keywords in CATEGORY_RULES.items():
        for word in keywords:
            if word in text:
                scores[cat] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "autre"

def classify_priority(text):
    text = text.lower()
    for priority, keywords in PRIORITY_RULES.items():
        if any(word in text for word in keywords):
            return priority
    return "normale"

def detect_duplicate(location, category, radius_meters=100):
    from .models import Complaint
    nearby = Complaint.objects.filter(
        category=category,
        location__distance_lte=(location, D(m=radius_meters))
    )
    return nearby.exists()

def classify(text, location=None, category=None):
    result = {
        "category": classify_category(text),
        "priority": classify_priority(text),
        "is_duplicate": False
    }
    if location and category:
        result["is_duplicate"] = detect_duplicate(location, category)
    return result