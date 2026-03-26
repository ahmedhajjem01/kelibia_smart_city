import math

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Radius of the Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    meters = R * c
    return meters
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

def detect_duplicate(lat, lon, category, radius_meters=100):
    from .models import Complaint
    # Get all recent complaints of the same category (limit to recent to optimize)
    recent_complaints = Complaint.objects.filter(category=category).order_by('-created_at')[:50]
    
    for c in recent_complaints:
        if c.latitude and c.longitude:
            dist = haversine_distance(lat, lon, c.latitude, c.longitude)
            if dist <= radius_meters:
                return True
    return False

def classify(text, lat=None, lon=None, category=None):
    result = {
        "category": classify_category(text),
        "priority": classify_priority(text),
        "is_duplicate": False
    }
    if lat is not None and lon is not None and category:
        result["is_duplicate"] = detect_duplicate(lat, lon, category)
    return result