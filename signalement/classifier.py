def classify(text):
    text = text.lower()

    if any(word in text for word in ["route", "trou", "chaussée"]):
        return "Voirie"
    elif any(word in text for word in ["poubelle", "déchet", "ordures"]):
        return "Déchets"
    elif any(word in text for word in ["lampe", "éclairage", "lumière"]):
        return "Éclairage public"
    elif any(word in text for word in ["eau", "canalisation"]):
        return "Eau & assainissement"
    else:
        return "Autres"