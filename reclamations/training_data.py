"""
Training data for the ML classifier.
Each entry: (text, category, priority)
Categories: lighting, trash, roads, noise, other
Priorities: urgente, normale, faible
"""

TRAINING_DATA = [
    # ─── LIGHTING ─────────────────────────────────────────────────────────────
    # normale
    ("Lampadaire éteint rue de la République", "lighting", "normale"),
    ("Éclairage public en panne dans notre quartier", "lighting", "normale"),
    ("Les lumières de la rue ne fonctionnent pas", "lighting", "normale"),
    ("Lampe cassée au coin de la rue depuis une semaine", "lighting", "normale"),
    ("Feu de rue défectueux, la nuit c'est très sombre", "lighting", "normale"),
    ("Ampoule grillée sur le lampadaire devant chez moi", "lighting", "normale"),
    ("Projecteur de la place principale en panne", "lighting", "normale"),
    ("Néon cassé dans la ruelle", "lighting", "normale"),
    ("Éclairage défaillant au niveau du marché", "lighting", "normale"),
    ("Les réverbères ne s'allument plus le soir", "lighting", "normale"),
    ("Panne d'éclairage dans la cité", "lighting", "normale"),
    ("Lampadaire renversé mais non dangereux", "lighting", "normale"),
    ("L'éclairage de la route principale est en panne depuis 3 jours", "lighting", "normale"),
    ("Pas de lumière dans mon allée la nuit", "lighting", "normale"),
    ("La rue n'est pas éclairée le soir", "lighting", "normale"),

    # urgente
    ("Fils électriques à nu pendants d'un lampadaire cassé, danger électrique", "lighting", "urgente"),
    ("Lampadaire tombé sur la chaussée, risque accident", "lighting", "urgente"),
    ("Câbles haute tension à portée des enfants suite à une tempête", "lighting", "urgente"),
    ("Poteau électrique brisé qui touche le sol, court-circuit possible", "lighting", "urgente"),
    ("Lampadaire effondré bloque la route, urgent", "lighting", "urgente"),
    ("Risque électrocution : fil dénudé dans la flaque d'eau", "lighting", "urgente"),

    # faible
    ("Ampoule légèrement moins brillante que d'habitude", "lighting", "faible"),
    ("Suggestion de mettre des lumières décoratives pour les fêtes", "lighting", "faible"),
    ("L'éclairage de la place est vieillot, ce serait bien de moderniser", "lighting", "faible"),

    # ─── TRASH ────────────────────────────────────────────────────────────────
    # normale
    ("Poubelles débordantes au bout de la rue", "trash", "normale"),
    ("Collecte des ordures non effectuée depuis plusieurs jours", "trash", "normale"),
    ("Dépôt sauvage d'ordures dans le terrain vague", "trash", "normale"),
    ("Déchets entassés sur le trottoir, mauvaise odeur", "trash", "normale"),
    ("Bacs à ordures pleins et non vidés", "trash", "normale"),
    ("Encombrants abandonnés devant l'école", "trash", "normale"),
    ("Sacs poubelles éventrés par les chats dans la rue", "trash", "normale"),
    ("Plage jonchée de déchets plastiques", "trash", "normale"),
    ("Ordures ménagères non ramassées depuis 5 jours", "trash", "normale"),
    ("Dépôt illégal de gravats dans la rue", "trash", "normale"),
    ("Conteneur à ordures renversé et non remis en place", "trash", "normale"),
    ("Les éboueurs n'ont pas collecté les poubelles ce matin", "trash", "normale"),
    ("Déchet et insalubrité au marché municipal", "trash", "normale"),
    ("Zone industrielle avec des déchets non traités", "trash", "normale"),
    ("Problème d'hygiène dû aux ordures accumulées", "trash", "normale"),

    # urgente
    ("Déversement de produits chimiques dans la rue, danger sanitaire", "trash", "urgente"),
    ("Fuite d'égout avec déchets liquides envahissant la chaussée", "trash", "urgente"),
    ("Déchets médicaux abandonnés dans le quartier, risque sanitaire grave", "trash", "urgente"),
    ("Ordures en feu dans une zone résidentielle", "trash", "urgente"),
    ("Inondation d'eaux usées causée par les déchets obstruant les canalisations", "trash", "urgente"),

    # faible
    ("Un peu de papiers par terre sur la place", "trash", "faible"),
    ("Quelques mégots devant l'entrée", "trash", "faible"),
    ("Légère saleté sur le banc du parc", "trash", "faible"),
    ("Graffiti sur une poubelle publique", "trash", "faible"),

    # ─── ROADS ────────────────────────────────────────────────────────────────
    # normale
    ("Nid de poule dangereux sur la route principale", "roads", "normale"),
    ("Trou dans la chaussée devant l'école", "roads", "normale"),
    ("Route dégradée, asphalte abîmé sur 50 mètres", "roads", "normale"),
    ("Trottoir défoncé, risque de chute pour les piétons", "roads", "normale"),
    ("Fissures profondes sur la voirie", "roads", "normale"),
    ("Voirie en très mauvais état, beaucoup de trous", "roads", "normale"),
    ("Caniveau bouché entraîne des inondations de la rue", "roads", "normale"),
    ("Panneau de signalisation manquant à l'intersection", "roads", "normale"),
    ("Marquage routier effacé, dangereux pour les conducteurs", "roads", "normale"),
    ("Dos d'âne non signalisé cause des accidents", "roads", "normale"),
    ("La chaussée est très abîmée après les pluies", "roads", "normale"),
    ("Trottoir cassé, une personne a failli tomber", "roads", "normale"),
    ("Revêtement routier décollé sur la route côtière", "roads", "normale"),
    ("Nids de poule multiples dans la zone commerciale", "roads", "normale"),
    ("Affaissement de terrain sous la route", "roads", "normale"),
    ("Route endommagée par les camions de construction", "roads", "normale"),
    ("Voie pavée avec des pavés qui se décollent", "roads", "normale"),

    # urgente
    ("Effondrement partiel de la route, voiture bloquée dans le trou", "roads", "urgente"),
    ("Pont endommagé, risque d'effondrement, route à fermer d'urgence", "roads", "urgente"),
    ("Glissement de terrain sur la route, passage totalement bloqué", "roads", "urgente"),
    ("Accident causé par un nid de poule non signalé, blessés", "roads", "urgente"),
    ("Inondation bloque complètement l'accès au quartier", "roads", "urgente"),
    ("Route effondrée suite aux pluies, urgence absolue", "roads", "urgente"),
    ("Mur de soutènement en train de céder sur la route", "roads", "urgente"),

    # faible
    ("Légère dégradation du marquage au sol", "roads", "faible"),
    ("Peinture sur trottoir effacée", "roads", "faible"),
    ("Panneau légèrement incliné mais lisible", "roads", "faible"),
    ("Suggestion d'installer un passage piéton", "roads", "faible"),
    ("La bordure du trottoir est légèrement ébréchée", "roads", "faible"),

    # ─── NOISE ────────────────────────────────────────────────────────────────
    # normale
    ("Voisin fait du bruit toute la nuit", "noise", "normale"),
    ("Café en face joue de la musique trop forte jusqu'à 2h du matin", "noise", "normale"),
    ("Chantier de construction bruyant pendant les heures de repos", "noise", "normale"),
    ("Klaxons excessifs dans notre rue la nuit", "noise", "normale"),
    ("Nuisance sonore provenant d'un garage automobile", "noise", "normale"),
    ("Fête bruyante qui dépasse les horaires autorisés", "noise", "normale"),
    ("Travaux nocturnes très bruyants dans mon quartier", "noise", "normale"),
    ("Restaurant avec musique live très forte la nuit", "noise", "normale"),
    ("Tapage nocturne récurrent dans l'immeuble", "noise", "normale"),
    ("Aboiements de chiens toute la nuit chez le voisin", "noise", "normale"),
    ("Bruit incessant de machines industrielles la nuit", "noise", "normale"),
    ("Klaxonnage agressif et permanent dans la rue piétonne", "noise", "normale"),

    # urgente
    ("Explosion entendue dans le quartier, origine inconnue", "noise", "urgente"),
    ("Bruit d'alarme incendie depuis une heure, personne ne répond", "noise", "urgente"),
    ("Son de détresse et cris dans l'immeuble voisin", "noise", "urgente"),

    # faible
    ("Léger bruit de la circulation qui dérange parfois", "noise", "faible"),
    ("Voisin joue de la guitare parfois le soir", "noise", "faible"),
    ("Bruit de fond du marché le matin", "noise", "faible"),
    ("Suggestion de créer une zone calme dans le quartier", "noise", "faible"),

    # ─── OTHER ────────────────────────────────────────────────────────────────
    # normale
    ("Fuite d'eau dans la rue depuis plusieurs jours", "other", "normale"),
    ("Arbre dangereux qui risque de tomber sur la voie publique", "other", "normale"),
    ("Poteau téléphonique penché prêt à tomber", "other", "normale"),
    ("Vandalisme sur le mobilier urbain du parc", "other", "normale"),
    ("Bancs cassés dans le jardin public", "other", "normale"),
    ("Graffiti sur les murs du collège", "other", "normale"),
    ("Absence de banc public dans la zone piétonne", "other", "normale"),
    ("Végétation envahissante bloquant la vue sur un carrefour", "other", "normale"),
    ("Fontaine publique en panne", "other", "normale"),
    ("Aire de jeux pour enfants dégradée et dangereuse", "other", "normale"),
    ("Manque d'espaces verts dans le quartier", "other", "normale"),
    ("Problème d'évacuation des eaux pluviales", "other", "normale"),
    ("Égout bouché et malodorant", "other", "normale"),
    ("Canalisation cassée et eau qui coule dans la rue", "other", "normale"),
    ("Feux de signalisation en panne à l'intersection principale", "other", "normale"),
    ("Parking public envahi par des marchands ambulants", "other", "normale"),

    # urgente
    ("Fuite de gaz détectée dans la rue, odeur forte, danger explosion", "other", "urgente"),
    ("Inondation soudaine dans le sous-sol, eau monte rapidement", "other", "urgente"),
    ("Immeuble menaçant de s'effondrer, habitants évacués", "other", "urgente"),
    ("Arbre tombé sur une voiture suite à la tempête, blessés possible", "other", "urgente"),
    ("Chute de personnes âgées suite à trottoir effondré", "other", "urgente"),
    ("Rupture de canalisation d'eau principale, rue inondée", "other", "urgente"),
    ("Animal blessé gisant sur la chaussée, risque accident", "other", "urgente"),
    ("Panique dans le marché suite à un incident, urgence intervention", "other", "urgente"),

    # faible
    ("Suggestion d'ajouter des fleurs dans la place principale", "other", "faible"),
    ("Les bancs du parc pourraient être repeints", "other", "faible"),
    ("Il manque un panneau d'information touristique", "other", "faible"),
    ("Proposition d'installer des pistes cyclables", "other", "faible"),
    ("La fontaine décorative mériterait d'être renovée", "other", "faible"),
    ("Demande de plantation d'arbres dans la rue", "other", "faible"),

    # ─── ARABIC / FRENCH MIXED (common in Tunisia) ───────────────────────────
    ("النور مطفي في الشارع", "lighting", "normale"),
    ("فضلات ومزبلة مليانة", "trash", "normale"),
    ("الطريق مخربة فيها حفرة كبيرة", "roads", "normale"),
    ("جيران يعملوا ضجة الليل كامل", "noise", "normale"),
    ("فيه تسرب ماء في الشارع", "other", "normale"),
    ("lampadaire cassé نور مطفي", "lighting", "normale"),
    ("poubelle débordante مزبلة مليانة", "trash", "normale"),
    ("trou route حفرة في الطريق", "roads", "normale"),
    ("bruit voisin ضجة جيران", "noise", "normale"),

    # ─── SHORT COLLOQUIAL TEXTS ───────────────────────────────────────────────
    ("Pas de lumière la nuit", "lighting", "normale"),
    ("Poubelles non vidées", "trash", "normale"),
    ("Route pleine de trous", "roads", "normale"),
    ("Trop de bruit la nuit", "noise", "normale"),
    ("Eau qui coule dans la rue", "other", "normale"),
    ("Fuite urgente, danger", "other", "urgente"),
    ("Éclairage en panne urgent câble nu", "lighting", "urgente"),
    ("Ordures chimiques danger", "trash", "urgente"),
    ("Route effondrée urgent", "roads", "urgente"),
    ("Bruit explosion urgence", "noise", "urgente"),
    ("Juste une suggestion amélioration", "other", "faible"),
    ("Esthétique du quartier à améliorer", "other", "faible"),
]
