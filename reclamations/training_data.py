"""
Training data for the ML classifier.
Each entry: (text, category, priority)
Categories: lighting, trash, roads, noise, other
Priorities: urgente, normale, faible

Dataset stats (enriched v2):
  Total:    ~530 samples
  urgente:  ~130  (was ~26)
  normale:  ~260  (was ~130)
  faible:   ~140  (was ~38)

Design principles:
  - urgente = immediate physical danger, injuries, fire, gas leak, electrocution,
               flooding, building collapse, chemical spill, children at risk
  - normale  = functional problem affecting daily life but no immediate danger
  - faible   = cosmetic, aesthetic, a suggestion, minor inconvenience
  - Balanced across all 5 categories
  - Includes Arabic, Tunisian dialect, French-Arabic mix, and short texts
"""

TRAINING_DATA = [

    # ══════════════════════════════════════════════════════════════════════════
    # LIGHTING
    # ══════════════════════════════════════════════════════════════════════════

    # ─── LIGHTING / normale ───────────────────────────────────────────────────
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
    ("Plusieurs lampadaires en panne dans la même rue", "lighting", "normale"),
    ("Éclairage intermittent sur l'avenue principale", "lighting", "normale"),
    ("Le lampadaire clignote toute la nuit et empêche de dormir", "lighting", "normale"),
    ("Panne d'éclairage dans le parking municipal", "lighting", "normale"),
    ("La route côtière est plongée dans le noir le soir", "lighting", "normale"),
    ("Spot d'éclairage du stade municipal hors service", "lighting", "normale"),
    ("Lampadaire cassé depuis une semaine, toujours pas réparé", "lighting", "normale"),
    ("Zone commerciale sans éclairage après 20h", "lighting", "normale"),
    ("L'éclairage public tombe en panne régulièrement dans notre rue", "lighting", "normale"),

    # ─── LIGHTING / urgente ───────────────────────────────────────────────────
    ("Fils électriques à nu pendants d'un lampadaire cassé, danger électrique", "lighting", "urgente"),
    ("Lampadaire tombé sur la chaussée, risque accident", "lighting", "urgente"),
    ("Câbles haute tension à portée des enfants suite à une tempête", "lighting", "urgente"),
    ("Poteau électrique brisé qui touche le sol, court-circuit possible", "lighting", "urgente"),
    ("Lampadaire effondré bloque la route, urgent", "lighting", "urgente"),
    ("Risque électrocution : fil dénudé dans la flaque d'eau", "lighting", "urgente"),
    ("Câble électrique tombé dans la rue, très dangereux, enfants qui jouent à côté", "lighting", "urgente"),
    ("Poteau électrique cassé par un camion, fils nus sur le sol", "lighting", "urgente"),
    ("Electrocution risque élevé : câble dénudé touche la clôture métallique", "lighting", "urgente"),
    ("Lampadaire renversé par la tempête, câbles sous tension visibles, danger immédiat", "lighting", "urgente"),
    ("Court-circuit dans une armoire électrique de rue, fumée visible", "lighting", "urgente"),
    ("Transformateur de rue qui fait des étincelles la nuit", "lighting", "urgente"),
    ("Poteau d'éclairage penché à 45 degrés, risque de chute sur les passants", "lighting", "urgente"),
    ("Fil haute tension arraché par un véhicule, pend à 1 mètre du sol", "lighting", "urgente"),
    ("Armoire électrique ouverte avec câbles exposés près d'une école", "lighting", "urgente"),
    ("Feu de câble électrique dans la boîte de jonction de la rue", "lighting", "urgente"),
    ("Câble THT (très haute tension) à terre après accident, zone à éviter absolument", "lighting", "urgente"),
    ("Lampadaire arraché par un accident de voiture, câbles sous tension trainent sur route", "lighting", "urgente"),
    ("Explosion d'un transformateur de quartier, coupure générale et fumée noire", "lighting", "urgente"),
    ("Poteau électrique planté dans une flaque, risque d'électrocution pour les enfants", "lighting", "urgente"),

    # ─── LIGHTING / faible ────────────────────────────────────────────────────
    ("Ampoule légèrement moins brillante que d'habitude", "lighting", "faible"),
    ("Suggestion de mettre des lumières décoratives pour les fêtes", "lighting", "faible"),
    ("L'éclairage de la place est vieillot, ce serait bien de moderniser", "lighting", "faible"),
    ("Il serait bien d'avoir un éclairage LED plus économique dans notre rue", "lighting", "faible"),
    ("La couleur des lampadaires n'est pas harmonieuse avec le quartier", "lighting", "faible"),
    ("Proposition d'ajouter des lampadaires solaires dans le parc", "lighting", "faible"),
    ("Le lampadaire devant ma maison est légèrement moins lumineux qu'avant", "lighting", "faible"),
    ("Suggestion de réduire l'intensité des lampadaires après minuit pour économiser", "lighting", "faible"),
    ("Éclairage un peu faible dans l'allée piétonne mais suffisant pour se déplacer", "lighting", "faible"),
    ("Il manque un lampadaire à l'entrée du parc pour améliorer l'ambiance", "lighting", "faible"),
    ("La lumière jaune des vieux lampadaires est peu agréable visuellement", "lighting", "faible"),
    ("Proposition de mettre des guirlandes lumineuses pour la saison estivale", "lighting", "faible"),

    # ══════════════════════════════════════════════════════════════════════════
    # TRASH
    # ══════════════════════════════════════════════════════════════════════════

    # ─── TRASH / normale ──────────────────────────────────────────────────────
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
    ("Déchets entassés depuis deux semaines dans le terrain vague derrière l'école", "trash", "normale"),
    ("Poubelle publique débordante depuis 3 jours dans le quartier résidentiel", "trash", "normale"),
    ("Déchets non collectés dans la rue du marché depuis le weekend", "trash", "normale"),
    ("Benne à ordures saturée au niveau du marché couvert", "trash", "normale"),
    ("Dépôt clandestin de vieux meubles et appareils électroménagers dans la rue", "trash", "normale"),
    ("Mauvaise odeur des poubelles non vidées devant l'école primaire", "trash", "normale"),
    ("Collecte irrégulière des ordures dans notre quartier", "trash", "normale"),
    ("Tas de déchets qui attire les rats dans la ruelle", "trash", "normale"),
    ("La plage est couverte de bouteilles plastiques et de déchets ce matin", "trash", "normale"),

    # ─── TRASH / urgente ──────────────────────────────────────────────────────
    ("Déversement de produits chimiques dans la rue, danger sanitaire", "trash", "urgente"),
    ("Fuite d'égout avec déchets liquides envahissant la chaussée", "trash", "urgente"),
    ("Déchets médicaux abandonnés dans le quartier, risque sanitaire grave", "trash", "urgente"),
    ("Ordures en feu dans une zone résidentielle", "trash", "urgente"),
    ("Inondation d'eaux usées causée par les déchets obstruant les canalisations", "trash", "urgente"),
    ("Fût de produits toxiques abandonné dans un terrain proche d'une école", "trash", "urgente"),
    ("Déversement d'huile industrielle dans la rue, risque de glissade et pollution", "trash", "urgente"),
    ("Poubelles incendiées devant un immeuble, flammes se propagent au bâtiment", "trash", "urgente"),
    ("Seringues usagées retrouvées dans le parc, enfants en danger", "trash", "urgente"),
    ("Déchets hospitaliers avec sang et matériaux contaminés jetés dans la rue", "trash", "urgente"),
    ("Bonbonnes de gaz percées abandonnées près des habitations, risque explosion", "trash", "urgente"),
    ("Fuite de produits chimiques d'un camion, vapeurs toxiques, évacuation nécessaire", "trash", "urgente"),
    ("Conteneur en feu dans le quartier, fumée noire épaisse, pompiers nécessaires", "trash", "urgente"),
    ("Déchets asbestos (amiante) abandonnés sur le trottoir, danger inhalation", "trash", "urgente"),
    ("Égout débordant avec eaux fécales inondant la rue et entrant dans les maisons", "trash", "urgente"),
    ("Rats envahissent les maisons depuis les ordures non collectées, morsures signalées", "trash", "urgente"),
    ("Explosion d'une bonbonne de gaz abandonnée dans les déchets", "trash", "urgente"),
    ("Déchets en feu bloquent l'accès au lycée, élèves bloqués", "trash", "urgente"),
    ("Produits phytosanitaires répandus sur la chaussée suite à un accident, évacuation urgente", "trash", "urgente"),
    ("Canalisation d'égout rompue, eaux noires dans la rue et mauvaises odeurs insupportables", "trash", "urgente"),

    # ─── TRASH / faible ───────────────────────────────────────────────────────
    ("Un peu de papiers par terre sur la place", "trash", "faible"),
    ("Quelques mégots devant l'entrée", "trash", "faible"),
    ("Légère saleté sur le banc du parc", "trash", "faible"),
    ("Graffiti sur une poubelle publique", "trash", "faible"),
    ("Quelques emballages de snack éparpillés près du lycée", "trash", "faible"),
    ("Un sac plastique s'est coincé dans l'arbuste de la place", "trash", "faible"),
    ("Légère accumulation de feuilles mortes non balayées devant la mairie", "trash", "faible"),
    ("Proposer l'installation de corbeilles supplémentaires dans le parc", "trash", "faible"),
    ("Deux ou trois bouteilles vides sur la plage ce matin, mineur", "trash", "faible"),
    ("Poubelle publique légèrement pleine mais pas débordante", "trash", "faible"),
    ("Quelques déchets de chantier éparpillés, rien d'alarmant", "trash", "faible"),
    ("Suggestion de mettre un bac de recyclage dans notre quartier", "trash", "faible"),
    ("Trace de boue sur le trottoir après passage d'un camion", "trash", "faible"),
    ("Il manque un bac à ordures à l'entrée du parc", "trash", "faible"),

    # ══════════════════════════════════════════════════════════════════════════
    # ROADS
    # ══════════════════════════════════════════════════════════════════════════

    # ─── ROADS / normale ──────────────────────────────────────────────────────
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
    ("Chaussée fissurée sur l'avenue principale, dangereux pour les motos", "roads", "normale"),
    ("Glissière de sécurité arrachée sur la route de la corniche", "roads", "normale"),
    ("Regard d'égout sans couvercle sur le trottoir, risque de chute", "roads", "normale"),
    ("Route défoncée après les travaux de canalisation, non réparée", "roads", "normale"),
    ("Boîte de regard à ciel ouvert au milieu du trottoir, piéton a chuté", "roads", "normale"),
    ("Dalles de trottoir descellées et instables dans la rue commerçante", "roads", "normale"),
    ("Signalisation routière abîmée et illisible à cause de la rouille", "roads", "normale"),

    # ─── ROADS / urgente ──────────────────────────────────────────────────────
    ("Effondrement partiel de la route, voiture bloquée dans le trou", "roads", "urgente"),
    ("Pont endommagé, risque d'effondrement, route à fermer d'urgence", "roads", "urgente"),
    ("Glissement de terrain sur la route, passage totalement bloqué", "roads", "urgente"),
    ("Accident causé par un nid de poule non signalé, blessés", "roads", "urgente"),
    ("Inondation bloque complètement l'accès au quartier", "roads", "urgente"),
    ("Route effondrée suite aux pluies, urgence absolue", "roads", "urgente"),
    ("Mur de soutènement en train de céder sur la route", "roads", "urgente"),
    ("Voiture tombée dans un affaissement de chaussée, conducteur blessé, secours en route", "roads", "urgente"),
    ("Pont qui craque et vibre dangereusement, fermer immédiatement à la circulation", "roads", "urgente"),
    ("Eboulement de rochers sur la route principale, accès coupé", "roads", "urgente"),
    ("Accident mortel causé par un nid de poule non signalisé sur la corniche", "roads", "urgente"),
    ("Inondation totale de la route, voiture emportée par le courant", "roads", "urgente"),
    ("Camion-citerne renversé bloque la route nationale, déversement de carburant", "roads", "urgente"),
    ("Chaussée effondrée sous un bus scolaire, enfants à l'intérieur", "roads", "urgente"),
    ("Glissière de sécurité arrachée sur un virage en falaise, risque de chute", "roads", "urgente"),
    ("Passage à niveau défectueux, barrières bloquées en position ouverte", "roads", "urgente"),
    ("Route côtière submergée par la mer, voitures bloquées", "roads", "urgente"),
    ("Tranchée non sécurisée dans la rue, personne âgée est tombée", "roads", "urgente"),
    ("Effondrement du pont piétonnier, structure encore debout mais imminente", "roads", "urgente"),
    ("Trou béant de 2 mètres apparu dans la chaussée cette nuit", "roads", "urgente"),

    # ─── ROADS / faible ───────────────────────────────────────────────────────
    ("Légère dégradation du marquage au sol", "roads", "faible"),
    ("Peinture sur trottoir effacée", "roads", "faible"),
    ("Panneau légèrement incliné mais lisible", "roads", "faible"),
    ("Suggestion d'installer un passage piéton", "roads", "faible"),
    ("La bordure du trottoir est légèrement ébréchée", "roads", "faible"),
    ("Quelques petites fissures superficielles sur le trottoir, non dangereuses", "roads", "faible"),
    ("La peinture du passage piéton est un peu effacée mais encore visible", "roads", "faible"),
    ("Il serait bien d'ajouter un dos d'âne devant l'école pour ralentir les voitures", "roads", "faible"),
    ("Borne de trottoir légèrement penchée, pas de danger réel", "roads", "faible"),
    ("Le marquage des places de stationnement est effacé dans le parking", "roads", "faible"),
    ("Proposition d'aménager une piste cyclable sur l'avenue principale", "roads", "faible"),
    ("Revêtement de la place légèrement vieilli, modernisation souhaitable", "roads", "faible"),
    ("Petit creux dans la chaussée, pas encore un vrai nid de poule", "roads", "faible"),
    ("Il manque un panneau de nom de rue dans la nouvelle cité", "roads", "faible"),
    ("Les lignes directionnelles au sol de la rue piétonne sont effacées", "roads", "faible"),

    # ══════════════════════════════════════════════════════════════════════════
    # NOISE
    # ══════════════════════════════════════════════════════════════════════════

    # ─── NOISE / normale ──────────────────────────────────────────────────────
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
    ("Discothèque clandestine dans le quartier résidentiel, bruit insupportable", "noise", "normale"),
    ("Voisin fait des travaux de rénovation le dimanche matin à 7h", "noise", "normale"),
    ("Le marché du matin génère un bruit excessif dès 5h du matin", "noise", "normale"),
    ("Bar avec terrasse bruyante en face de l'école, interdit par la loi", "noise", "normale"),
    ("Générateur de chantier qui tourne toute la nuit sans arrêt", "noise", "normale"),
    ("Concerts répétés dans un jardin privé voisin jusqu'à 3h du matin", "noise", "normale"),
    ("Locaux industriels proches d'une zone résidentielle, bruit constant", "noise", "normale"),
    ("Système d'alarme d'une voiture qui se déclenche toutes les nuits", "noise", "normale"),
    ("Atelier de mécanique bruyant à côté d'une résidence, bruit de meuleuse toute la journée", "noise", "normale"),
    ("Mariage bruyant jusqu'à 5h du matin en pleine semaine", "noise", "normale"),

    # ─── NOISE / urgente ──────────────────────────────────────────────────────
    ("Explosion entendue dans le quartier, origine inconnue", "noise", "urgente"),
    ("Bruit d'alarme incendie depuis une heure, personne ne répond", "noise", "urgente"),
    ("Son de détresse et cris dans l'immeuble voisin", "noise", "urgente"),
    ("Déflagration massive entendue dans le port, possible explosion industrielle", "noise", "urgente"),
    ("Cris de femme et bruits de violence derrière la porte du voisin", "noise", "urgente"),
    ("Explosion de gaz entendue dans l'immeuble d'en face, fenêtres brisées", "noise", "urgente"),
    ("Alarme de camion de transport d'hydrocarbures qui sonne sans s'arrêter", "noise", "urgente"),
    ("Bruit sourd répété sous un bâtiment : risque d'effondrement", "noise", "urgente"),
    ("Claquements et craquements dans la structure de l'immeuble la nuit, bâtiment instable", "noise", "urgente"),
    ("Bruit de fusillade dans le quartier, personnes apeurées", "noise", "urgente"),
    ("Fracas et cris d'agression devant l'école, enfants en danger", "noise", "urgente"),
    ("Bruit d'une voiture qui percute un piéton, personne à terre, besoin ambulance", "noise", "urgente"),
    ("Explosion chimique dans l'usine voisine, bruit assourdissant et fumée", "noise", "urgente"),
    ("Alarme de centrale électrique qui sonne depuis 2 heures, risque de panne générale", "noise", "urgente"),

    # ─── NOISE / faible ───────────────────────────────────────────────────────
    ("Léger bruit de la circulation qui dérange parfois", "noise", "faible"),
    ("Voisin joue de la guitare parfois le soir", "noise", "faible"),
    ("Bruit de fond du marché le matin", "noise", "faible"),
    ("Suggestion de créer une zone calme dans le quartier", "noise", "faible"),
    ("Les oiseaux font du bruit tôt le matin dans le jardin public", "noise", "faible"),
    ("Voisin regarde la télé un peu fort le soir, pas trop gênant", "noise", "faible"),
    ("Bruit de pas à l'étage supérieur en soirée, léger", "noise", "faible"),
    ("Sonnette de la boulangerie qui tinte à chaque client, mineur", "noise", "faible"),
    ("Le vent fait claquer un volet dans la rue, pourrait être fixé", "noise", "faible"),
    ("Proposer une zone de silence dans le parc municipal", "noise", "faible"),
    ("Légère nuisance sonore du ventilateur de la climatisation du café voisin", "noise", "faible"),
    ("Bruit occasionnel du passage du tramway de nuit, acceptable mais gênant", "noise", "faible"),
    ("Le voisin joue de la musique classique certains soirs, peu gênant", "noise", "faible"),

    # ══════════════════════════════════════════════════════════════════════════
    # OTHER
    # ══════════════════════════════════════════════════════════════════════════

    # ─── OTHER / normale ──────────────────────────────────────────────────────
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
    ("Tuyauterie apparente et dégradée sur la façade du bâtiment municipal", "other", "normale"),
    ("Coupure d'eau répétée dans notre immeuble depuis une semaine", "other", "normale"),
    ("Jeu pour enfants rouillé et avec des bords tranchants dans le parc", "other", "normale"),
    ("Panneau de signalisation tombé et non remplacé depuis un mois", "other", "normale"),
    ("Fuite sur le réseau d'eau potable, eau gaspillée depuis 3 jours", "other", "normale"),
    ("Portail du cimetière municipal cassé et impossible à fermer", "other", "normale"),
    ("Filet de basket du terrain public complètement déchiré", "other", "normale"),
    ("Branchement sauvage sur le réseau d'eau public dans le quartier", "other", "normale"),

    # ─── OTHER / urgente ──────────────────────────────────────────────────────
    ("Fuite de gaz détectée dans la rue, odeur forte, danger explosion", "other", "urgente"),
    ("Inondation soudaine dans le sous-sol, eau monte rapidement", "other", "urgente"),
    ("Immeuble menaçant de s'effondrer, habitants évacués", "other", "urgente"),
    ("Arbre tombé sur une voiture suite à la tempête, blessés possible", "other", "urgente"),
    ("Chute de personnes âgées suite à trottoir effondré", "other", "urgente"),
    ("Rupture de canalisation d'eau principale, rue inondée", "other", "urgente"),
    ("Animal blessé gisant sur la chaussée, risque accident", "other", "urgente"),
    ("Panique dans le marché suite à un incident, urgence intervention", "other", "urgente"),
    ("Incendie dans un appartement du quartier, fumée visible, pompiers appelés", "other", "urgente"),
    ("Personne coincée dans l'ascenseur de l'immeuble municipal, enfant dedans", "other", "urgente"),
    ("Noyade imminente sur la plage, nageur en difficulté", "other", "urgente"),
    ("Accident de voiture grave devant l'école, enfants témoins, blessés au sol", "other", "urgente"),
    ("Fuite de gaz dans un immeuble résidentiel, odeur très forte, habitants à évacuer", "other", "urgente"),
    ("Mur de soutènement effondré sur une maison voisine, personnes ensevelies", "other", "urgente"),
    ("Rixe violente avec blessés dans la rue, intervention police urgente", "other", "urgente"),
    ("Enfant tombé dans un puits à ciel ouvert, secours urgent", "other", "urgente"),
    ("Rupture d'une conduite principale d'eau chaude, vapeur et eau bouillante dans la rue", "other", "urgente"),
    ("Glissement de terrain menace plusieurs habitations, évacuation nécessaire", "other", "urgente"),
    ("Intoxication alimentaire collective au marché, plusieurs personnes hospitalisées", "other", "urgente"),
    ("Personne inconsciente sur le trottoir, passants autour, ambulance non encore arrivée", "other", "urgente"),

    # ─── OTHER / faible ───────────────────────────────────────────────────────
    ("Suggestion d'ajouter des fleurs dans la place principale", "other", "faible"),
    ("Les bancs du parc pourraient être repeints", "other", "faible"),
    ("Il manque un panneau d'information touristique", "other", "faible"),
    ("Proposition d'installer des pistes cyclables", "other", "faible"),
    ("La fontaine décorative mériterait d'être renovée", "other", "faible"),
    ("Demande de plantation d'arbres dans la rue", "other", "faible"),
    ("Le portail du parc gagnerait à être repeint", "other", "faible"),
    ("Il serait agréable d'avoir une fontaine à eau potable dans le parc", "other", "faible"),
    ("Suggestion d'installer des toilettes publiques dans le centre-ville", "other", "faible"),
    ("La mairie pourrait organiser plus de marchés locaux", "other", "faible"),
    ("Les horaires d'ouverture de la bibliothèque municipale pourraient être élargis", "other", "faible"),
    ("Proposition de créer un espace skate pour les jeunes du quartier", "other", "faible"),
    ("Il serait bien d'aménager une zone barbecue dans le parc", "other", "faible"),
    ("Le terrain de pétanque du parc mériterait d'être remis en état", "other", "faible"),
    ("Demande d'un panneau d'affichage associatif dans le quartier", "other", "faible"),

    # ══════════════════════════════════════════════════════════════════════════
    # ARABIC / DIALECTAL TUNISIAN
    # ══════════════════════════════════════════════════════════════════════════

    # normale
    ("النور مطفي في الشارع", "lighting", "normale"),
    ("فضلات ومزبلة مليانة", "trash", "normale"),
    ("الطريق مخربة فيها حفرة كبيرة", "roads", "normale"),
    ("جيران يعملوا ضجة الليل كامل", "noise", "normale"),
    ("فيه تسرب ماء في الشارع", "other", "normale"),
    ("الكهرباء مقطوعة في الحي منذ أمس", "lighting", "normale"),
    ("الزبالة ما تجمعتش من أسبوع", "trash", "normale"),
    ("الطريق خربانة وفيها حفر كثيرة", "roads", "normale"),
    ("السقف يسرب والمي تنزل في البيت", "other", "normale"),
    ("ما فيش نور في الزنقة", "lighting", "normale"),
    ("الشارع وسخ والزبالة مليانة", "trash", "normale"),

    # urgente
    ("في ريحة غاز قوية قرب البيوت خطر انفجار", "other", "urgente"),
    ("كابل كهربائي طاح في الشارع خطر موت", "lighting", "urgente"),
    ("فيه فيضان والمي تدخل في البيوت", "roads", "urgente"),
    ("حريق في البناية الجيران يصرخوا", "other", "urgente"),
    ("طفل طاح في بئر مفتوحة نجدة عاجلة", "other", "urgente"),
    ("مواد كيمياوية انسكبت في الشارع خطر على الأطفال", "trash", "urgente"),
    ("صوت انفجار في الحي ما نعرفوش الأصل", "noise", "urgente"),
    ("عمارة على وشك السقوط سكانها هربوا", "other", "urgente"),

    # faible
    ("الحديقة محتاجة ورود وأشجار جديدة", "other", "faible"),
    ("اقتراح برسم فن على الجدران", "other", "faible"),
    ("النور شوية باهت بس ما فيش خطر", "lighting", "faible"),
    ("كرسي الحديقة محتاج صبغة بس ما فيش خطر", "other", "faible"),
    ("كمية صغيرة من الزبالة قرب المدخل", "trash", "faible"),

    # ══════════════════════════════════════════════════════════════════════════
    # FRENCH-ARABIC MIX (common in Tunisia)
    # ══════════════════════════════════════════════════════════════════════════

    ("lampadaire cassé نور مطفي", "lighting", "normale"),
    ("poubelle débordante مزبلة مليانة", "trash", "normale"),
    ("trou route حفرة في الطريق", "roads", "normale"),
    ("bruit voisin ضجة جيران", "noise", "normale"),
    ("fuite eau تسرب ماء في الشارع", "other", "normale"),
    ("câble électrique à nu خطر كهرباء", "lighting", "urgente"),
    ("incendie poubelle نار في الزبالة urgence", "trash", "urgente"),
    ("route effondrée الطريق غرقت urgence", "roads", "urgente"),
    ("explosion gaz ريحة غاز خطر انفجار", "other", "urgente"),
    ("suggestion amélioration اقتراح تحسين الحديقة", "other", "faible"),

    # ══════════════════════════════════════════════════════════════════════════
    # SHORT / COLLOQUIAL FRENCH (common on mobile)
    # ══════════════════════════════════════════════════════════════════════════

    # normale
    ("Pas de lumière la nuit", "lighting", "normale"),
    ("Poubelles non vidées", "trash", "normale"),
    ("Route pleine de trous", "roads", "normale"),
    ("Trop de bruit la nuit", "noise", "normale"),
    ("Eau qui coule dans la rue", "other", "normale"),
    ("Lampadaire en panne depuis 1 semaine", "lighting", "normale"),
    ("Collecte poubelle pas faite", "trash", "normale"),
    ("Trottoir cassé chute possible", "roads", "normale"),
    ("Fête trop bruyante cette nuit encore", "noise", "normale"),
    ("Fontaine publique en panne depuis longtemps", "other", "normale"),

    # urgente
    ("Fuite urgente, danger", "other", "urgente"),
    ("Éclairage en panne urgent câble nu", "lighting", "urgente"),
    ("Ordures chimiques danger", "trash", "urgente"),
    ("Route effondrée urgent", "roads", "urgente"),
    ("Bruit explosion urgence", "noise", "urgente"),
    ("Câble électrique par terre enfants jouent à côté danger", "lighting", "urgente"),
    ("Incendie poubelles devant immeuble", "trash", "urgente"),
    ("Personne blessée chute trou chaussée", "roads", "urgente"),
    ("Cris détresse voisin besoin secours", "noise", "urgente"),
    ("Fuite gaz forte odeur appel pompiers", "other", "urgente"),
    ("Inondation maison eau monte urgent", "other", "urgente"),
    ("Enfant blessé terrain de jeu cassé", "other", "urgente"),
    ("Accident route blessé ambulance", "roads", "urgente"),

    # faible
    ("Juste une suggestion amélioration", "other", "faible"),
    ("Esthétique du quartier à améliorer", "other", "faible"),
    ("Petite fissure pas grave sur trottoir", "roads", "faible"),
    ("Lumière un peu faible mais ça va", "lighting", "faible"),
    ("Quelques papiers par terre", "trash", "faible"),
    ("Bruit léger pas trop gênant", "noise", "faible"),
    ("Idée pour embellir la rue", "other", "faible"),
    ("Proposition nouvelle poubelle de recyclage", "trash", "faible"),
    ("Peinture trottoir effacée non urgent", "roads", "faible"),
    ("Guitare voisin le soir pas vraiment grave", "noise", "faible"),

    # ══════════════════════════════════════════════════════════════════════════
    # PRIORITY-SIGNAL KEYWORD REINFORCEMENT
    # Deliberately keyword-rich to teach the model signal words per priority
    # ══════════════════════════════════════════════════════════════════════════

    # urgente signals: mort, décès, blessé, sang, feu, flamme, explosion, gaz,
    #                  électrocution, noyade, effondrement, enfant danger, ambulance,
    #                  pompier, urgence absolue, secours, évacuation, immédiat
    ("Urgence absolue : enfant blessé, sang visible, ambulance appelée", "other", "urgente"),
    ("Feu dans la rue, flammes et fumée noire, pompiers en route", "other", "urgente"),
    ("Électrocution risque immédiat, personne inconsciente au sol", "lighting", "urgente"),
    ("Noyade en cours sur la plage, secours nécessaire immédiatement", "other", "urgente"),
    ("Effondrement bâtiment imminent, évacuation urgente du quartier", "other", "urgente"),
    ("Explosion de gaz, flammes visibles, appel pompiers", "other", "urgente"),
    ("Blessé grave accident de route, sang, ambulance demandée", "roads", "urgente"),
    ("Mort possible, personne inconsciente, secours d'urgence", "other", "urgente"),
    ("Risque électrocution immédiat, enfant près des câbles", "lighting", "urgente"),
    ("Incendie déclaré immeuble résidentiel, habitants piégés, urgence", "other", "urgente"),

    # faible signals: suggestion, idée, proposer, esthétique, décoration,
    #                 légèrement, un peu, mineur, pas urgent, amélioration
    ("Simple suggestion esthétique pour le quartier, rien d'urgent", "other", "faible"),
    ("Idée décorative pour les espaces verts, pas pressé", "other", "faible"),
    ("Légère imperfection, vraiment pas urgent du tout", "roads", "faible"),
    ("Proposer une amélioration cosmétique mineure", "other", "faible"),
    ("Un peu moins propre qu'habituellement, rien d'alarmant", "trash", "faible"),
    ("Suggestion d'embellissement, à faire quand possible", "other", "faible"),
    ("Légèrement abîmé mais utilisable et non dangereux", "roads", "faible"),
    ("Mineur : ampoule un peu moins lumineuse, pas urgent", "lighting", "faible"),
    ("Bruit très léger et occasionnel, pas vraiment dérangeant", "noise", "faible"),
    ("Idée d'amélioration à long terme pour le quartier", "other", "faible"),
]
