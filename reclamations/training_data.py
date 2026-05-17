"""
Training data for the ML classifier.
Each entry: (text, category, priority)
Categories: lighting, trash, roads, noise, other
Priorities: urgente, normale, faible

Dataset stats (enriched v3):
  Total:    ~680 samples
  urgente:  ~160
  normale:  ~310
  faible:   ~210

Design principles:
  - urgente = immediate physical danger, injuries, fire, gas leak, electrocution,
               flooding, building collapse, chemical spill, children at risk
  - normale  = functional problem affecting daily life but no immediate danger
  - faible   = cosmetic, aesthetic, a suggestion, minor inconvenience
  - Balanced across all 5 categories
  - Includes Arabic (MSA + Tunisian dialect), French-Arabic mix, and short texts
  - Arabic section significantly expanded in v3 for better generalisation
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
    # ARABIC / DIALECTAL TUNISIAN  (v3 — significantly expanded)
    # ══════════════════════════════════════════════════════════════════════════

    # ─── ARABIC LIGHTING ──────────────────────────────────────────────────────
    # normale
    ("النور مطفي في الشارع", "lighting", "normale"),
    ("الكهرباء مقطوعة في الحي منذ أمس", "lighting", "normale"),
    ("ما فيش نور في الزنقة", "lighting", "normale"),
    ("العمود الكهربائي تعطل من أسبوع", "lighting", "normale"),
    ("الإنارة العمومية مش تشتغل في حينا", "lighting", "normale"),
    ("مصباح الشارع مكسور ومطفي منذ أيام", "lighting", "normale"),
    ("النور يبرق ويطفى كل الليل في الطريق", "lighting", "normale"),
    ("إنارة الحديقة العمومية خربانة", "lighting", "normale"),
    ("مصابيح الشوارع ما تضيئوش من أسبوعين", "lighting", "normale"),
    ("الإنارة مقطوعة في الطريق الرئيسي", "lighting", "normale"),

    # urgente
    ("كابل كهربائي طاح في الشارع خطر موت", "lighting", "urgente"),
    ("أسلاك كهرباء مكشوفة قرب الأطفال خطر عاجل", "lighting", "urgente"),
    ("عمود كهربائي سقط وفيه أسلاك تحت التوتر", "lighting", "urgente"),
    ("خطر صعق كهربائي سلك مكشوف في برك المي", "lighting", "urgente"),
    ("حريق في صندوق الكهرباء في الشارع دخان", "lighting", "urgente"),
    ("عمود إنارة سقط وقطع الطريق والأسلاك متشرشرة", "lighting", "urgente"),

    # faible
    ("النور شوية باهت بس ما فيش خطر", "lighting", "faible"),
    ("اقتراح تركيب مصابيح LED اقتصادية في الحي", "lighting", "faible"),
    ("لون الإنارة ما يعجبنيش بس مش ضروري", "lighting", "faible"),
    ("المصباح أضعف شوية من العادي بس ما فيش خطر", "lighting", "faible"),

    # ─── ARABIC TRASH ─────────────────────────────────────────────────────────
    # normale
    ("فضلات ومزبلة مليانة", "trash", "normale"),
    ("الزبالة ما تجمعتش من أسبوع", "trash", "normale"),
    ("الشارع وسخ والزبالة مليانة", "trash", "normale"),
    ("القمامة متراكمة في الحي منذ أيام", "trash", "normale"),
    ("الحاوية مليانة وتفوح روايح كريهة", "trash", "normale"),
    ("ما جاوش يجمعوا الزبالة من أسبوع", "trash", "normale"),
    ("نفايات متراكمة في الشارع تجذب الفئران", "trash", "normale"),
    ("الشاحنة ما جاتش تجمع الزبالة الليلة", "trash", "normale"),
    ("القمامة أمام المدرسة ما تجمعتش من أيام", "trash", "normale"),
    ("وسخ ونفايات في الحارة يضر بالصحة", "trash", "normale"),

    # urgente
    ("مواد كيمياوية انسكبت في الشارع خطر على الأطفال", "trash", "urgente"),
    ("حريق في القمامة أمام البناية واللهب ينتشر", "trash", "urgente"),
    ("محاقن ملقاة في الحديقة خطر على الأطفال", "trash", "urgente"),
    ("نفايات طبية ملقاة في الشارع خطر صحي كبير", "trash", "urgente"),
    ("مجاري تفيض بالفضلات السائلة وتدخل البيوت", "trash", "urgente"),
    ("انسكاب وقود في الشارع خطر حريق وتلوث", "trash", "urgente"),

    # faible
    ("كمية صغيرة من الزبالة قرب المدخل", "trash", "faible"),
    ("اقتراح وضع حاويات تدوير في الحي", "trash", "faible"),
    ("ورقات قليلة في الأرض مش خطير", "trash", "faible"),
    ("الحاوية قريبة تمتلئ بس ما فيش مشكل كبير", "trash", "faible"),

    # ─── ARABIC ROADS ─────────────────────────────────────────────────────────
    # normale
    ("الطريق مخربة فيها حفرة كبيرة", "roads", "normale"),
    ("الطريق خربانة وفيها حفر كثيرة", "roads", "normale"),
    ("الرصيف مكسور وفيه خطر السقوط", "roads", "normale"),
    ("الطريق تالفة بعد الشتاء وفيها حفر", "roads", "normale"),
    ("الإشارات المرورية غير موجودة في التقاطع", "roads", "normale"),
    ("الطريق الرئيسي فيه حفر كثيرة تضر السيارات", "roads", "normale"),
    ("الرصيف مكسور وإمرأة عجوز كادت تسقط", "roads", "normale"),
    ("الطلاء على الطريق محى ومش واضح", "roads", "normale"),
    ("فيه غطاء بالوعة مفقود في الرصيف خطر", "roads", "normale"),
    ("الطريق تلفت بعد أشغال القناة ما رجعوش يصلحوها", "roads", "normale"),

    # urgente
    ("فيه فيضان والمي تدخل في البيوت", "roads", "urgente"),
    ("الطريق انهارت وسيارة غاصت في الحفرة", "roads", "urgente"),
    ("جسر مهدد بالانهيار يجب إغلاقه فوراً", "roads", "urgente"),
    ("حادث سير خطير بسبب حفرة ما فيهاش إشارة", "roads", "urgente"),
    ("انزلاق صخور على الطريق وقطع المرور", "roads", "urgente"),
    ("الطريق غرقت بالكامل والسيارات محاصرة", "roads", "urgente"),

    # faible
    ("الطلاء على الرصيف بهت بس مش خطير", "roads", "faible"),
    ("اقتراح تركيب مسار للدراجات في الشارع الرئيسي", "roads", "faible"),
    ("لافتة اسم الشارع مش موجودة في الحي الجديد", "roads", "faible"),
    ("شقوق صغيرة على الرصيف مش خطيرة", "roads", "faible"),

    # ─── ARABIC NOISE ─────────────────────────────────────────────────────────
    # normale
    ("جيران يعملوا ضجة الليل كامل", "noise", "normale"),
    ("قهوة في الجهة الثانية تشغل موسيقى عالية لحدود الفجر", "noise", "normale"),
    ("ورشة بناء تعمل في وقت الراحة وتزعج الناس", "noise", "normale"),
    ("عرس صاخب حتى الساعة 4 صبحاً في وسط الأسبوع", "noise", "normale"),
    ("جاري عنده آلات تصنيع تعمل الليل كامل", "noise", "normale"),
    ("ضجيج كلاب الجار من الليل لحد الصبح", "noise", "normale"),
    ("بار في الشارع فيه موسيقى عالية بعد منتصف الليل", "noise", "normale"),
    ("المولدة في الورشة تشتغل الليل وتزعج الحي", "noise", "normale"),
    ("صياح متكرر ليلاً في البناية يمنع النوم", "noise", "normale"),
    ("أشغال الأحد الصبح الباكر تزعج العائلات", "noise", "normale"),

    # urgente
    ("صوت انفجار في الحي ما نعرفوش الأصل", "noise", "urgente"),
    ("طرطقة وصراخ في الشقة الجيران صورة عنف", "noise", "urgente"),
    ("صوت انفجار غاز في البناية والشبابيك تكسرت", "noise", "urgente"),
    ("صراخ واستغاثة من الجار وفيه عنف", "noise", "urgente"),
    ("إنذار حريق يرن منذ ساعة وما جاش أحد", "noise", "urgente"),
    ("دوي إطلاق نار في الحي والناس خايفين", "noise", "urgente"),

    # faible
    ("ضجيج خفيف من السير في الشارع بيين بيين", "noise", "faible"),
    ("الجار يعزف موسيقى أحياناً الليل بصح ما يزعجش بزاف", "noise", "faible"),
    ("ضجيج بسيط من المقهى بكري الصبح", "noise", "faible"),
    ("اقتراح إنشاء منطقة هادئة في الحديقة العمومية", "noise", "faible"),

    # ─── ARABIC OTHER ─────────────────────────────────────────────────────────
    # normale
    ("فيه تسرب ماء في الشارع", "other", "normale"),
    ("السقف يسرب والمي تنزل في البيت", "other", "normale"),
    ("شجرة مايلة وقريبة تسقط على الشارع", "other", "normale"),
    ("البالوعة مسدودة وفيها روايح كريهة", "other", "normale"),
    ("نافورة الحديقة تعطلت ومش تشتغل", "other", "normale"),
    ("تسرب في خط الماء الرئيسي والمي تضيع", "other", "normale"),
    ("المصلى البلدي محتاج صيانة عاجلة", "other", "normale"),
    ("حنفية الماء العمومية خربانة والمي تجري", "other", "normale"),
    ("إشارات المرور معطلة في التقاطع الرئيسي", "other", "normale"),
    ("الملعب البلدي خربان والعتاد تالف", "other", "normale"),
    ("أرجوحات الحديقة مكسورة وخطيرة على الأطفال", "other", "normale"),
    ("انقطاع متكرر للماء في عمارتنا من أسبوع", "other", "normale"),

    # urgente
    ("في ريحة غاز قوية قرب البيوت خطر انفجار", "other", "urgente"),
    ("حريق في البناية الجيران يصرخوا", "other", "urgente"),
    ("طفل طاح في بئر مفتوحة نجدة عاجلة", "other", "urgente"),
    ("عمارة على وشك السقوط سكانها هربوا", "other", "urgente"),
    ("شخص مغمى عليه في الرصيف ما وصلتش الإسعاف", "other", "urgente"),
    ("انفجار أنبوب الغاز في البناية وفيه دخان", "other", "urgente"),
    ("حادثة سير خطيرة أمام المدرسة وفيه مصابين", "other", "urgente"),
    ("تسمم جماعي في السوق أشخاص نقلوا للمستشفى", "other", "urgente"),
    ("انهيار جدار على بيت الجيران وفيه مصابين", "other", "urgente"),
    ("غرق في الشاطئ شخص في خطر يحتاج نجدة", "other", "urgente"),

    # faible
    ("الحديقة محتاجة ورود وأشجار جديدة", "other", "faible"),
    ("اقتراح برسم فن على الجدران", "other", "faible"),
    ("كرسي الحديقة محتاج صبغة بس ما فيش خطر", "other", "faible"),
    ("اقتراح تركيب حمامات عمومية في وسط المدينة", "other", "faible"),
    ("النافورة الزينة محتاجة ترميم للتجميل", "other", "faible"),
    ("اقتراح تنظيم أسواق محلية أكثر في الحي", "other", "faible"),
    ("ملعب البيتانك في الحديقة يحتاج صيانة بسيطة", "other", "faible"),

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

    # ══════════════════════════════════════════════════════════════════════════
    # EXPANSION v4 — 140 additional samples for better generalisation
    # ══════════════════════════════════════════════════════════════════════════

    # ─── LIGHTING / normale (10) ──────────────────────────────────────────────
    ("Le couloir de l'immeuble municipal est plongé dans le noir", "lighting", "normale"),
    ("L'éclairage du tunnel piétonnier est en panne depuis lundi", "lighting", "normale"),
    ("Trois lampadaires consécutifs éteints sur la rue du port", "lighting", "normale"),
    ("La place du marché n'est plus éclairée le soir", "lighting", "normale"),
    ("Réverbère tombé dans la haie, non dangereux mais à relever", "lighting", "normale"),
    ("L'allée menant au cimetière est sans éclairage la nuit", "lighting", "normale"),
    ("Lampe de rue hors service depuis quinze jours sans intervention", "lighting", "normale"),
    ("L'entrée du lycée est dans le noir le soir, élèves gênés", "lighting", "normale"),
    ("Éclairage du parking de la mairie défaillant", "lighting", "normale"),
    ("Le pont est mal éclairé la nuit, circulation difficile", "lighting", "normale"),

    # ─── LIGHTING / urgente (10) ──────────────────────────────────────────────
    ("Câble électrique nu tombé sur le capot d'une voiture garée", "lighting", "urgente"),
    ("Poteau d'éclairage renversé par le vent bloque la sortie d'école", "lighting", "urgente"),
    ("Fils sous tension traînent dans une flaque après la pluie, danger immédiat", "lighting", "urgente"),
    ("Boîtier électrique ouvert et fumant dans la rue commerçante", "lighting", "urgente"),
    ("Lampadaire arraché pend sur la route, voitures le contournent difficilement", "lighting", "urgente"),
    ("Étincelles visibles sur le transformateur de la rue chaque nuit", "lighting", "urgente"),
    ("Câble haute tension effondré sur le toit d'une voiture, conducteur bloqué", "lighting", "urgente"),
    ("Armoire de commande électrique vandalisée, câbles exposés à la pluie", "lighting", "urgente"),
    ("Poteau électrique brisé à mi-hauteur, penche sur la chaussée", "lighting", "urgente"),
    ("Enfant a reçu une décharge en touchant un lampadaire, hospitalisation", "lighting", "urgente"),

    # ─── LIGHTING / faible (8) ────────────────────────────────────────────────
    ("Les lampadaires de la promenade sont un peu vieillots", "lighting", "faible"),
    ("Il serait bien d'installer des détecteurs de présence dans les ruelles", "lighting", "faible"),
    ("La teinte des néons du marché est peu flatteuse pour les étals", "lighting", "faible"),
    ("Proposition de mise en lumière du minaret pour la saison touristique", "lighting", "faible"),
    ("Éclairage légèrement insuffisant dans le parking mais on s'y voit quand même", "lighting", "faible"),
    ("Un lampadaire de moins sur l'avenue ne gêne pas vraiment", "lighting", "faible"),
    ("Suggestion de lampadaires solaires pour la piste cyclable", "lighting", "faible"),
    ("La couleur jaune des vieux lampadaires manque de modernité", "lighting", "faible"),

    # ─── TRASH / normale (10) ─────────────────────────────────────────────────
    ("Les poubelles de la plage débordent chaque week-end", "trash", "normale"),
    ("Dépôt sauvage de pneus usagés derrière le stade", "trash", "normale"),
    ("Les ordures du marché du vendredi ne sont pas ramassées le soir même", "trash", "normale"),
    ("Gravats de construction laissés sur le trottoir depuis deux semaines", "trash", "normale"),
    ("Les rats ont éventré les sacs poubelles dans la ruelle", "trash", "normale"),
    ("Collecte des encombrants non effectuée malgré la demande faite il y a dix jours", "trash", "normale"),
    ("Bac à ordures renversé par le vent et non redressé depuis trois jours", "trash", "normale"),
    ("Déchets de chantier illégalement déversés dans le terrain communal", "trash", "normale"),
    ("Odeur nauséabonde des poubelles non collectées dans la cité", "trash", "normale"),
    ("Les poubelles publiques de la corniche sont saturées tous les matins", "trash", "normale"),

    # ─── TRASH / urgente (10) ─────────────────────────────────────────────────
    ("Incendie dans une benne à ordures, flammes proches d'un bâtiment résidentiel", "trash", "urgente"),
    ("Déversement de produits chimiques industriels dans la rue, vapeurs toxiques", "trash", "urgente"),
    ("Seringues et déchets médicaux abandonnés près de l'école primaire", "trash", "urgente"),
    ("Fût de produit corrosif non identifié renversé sur le trottoir", "trash", "urgente"),
    ("Égout débordant d'eaux fécales envahit le rez-de-chaussée des habitations", "trash", "urgente"),
    ("Déchets en feu bloquent l'accès aux urgences de la polyclinique", "trash", "urgente"),
    ("Produits pétroliers déversés dans la rue après accident de camion-citerne", "trash", "urgente"),
    ("Conteneur de déchets hospitaliers renversé sur la voie publique", "trash", "urgente"),
    ("Rats en grand nombre envahissent les cuisines depuis les ordures en décomposition", "trash", "urgente"),
    ("Fuite d'égout massive, eaux noires inondent plusieurs rues du quartier", "trash", "urgente"),

    # ─── TRASH / faible (8) ───────────────────────────────────────────────────
    ("Quelques capsules de bouteilles sur le sol de la place", "trash", "faible"),
    ("Un carton abandonné devant la boulangerie, pas urgent", "trash", "faible"),
    ("Légère saleté sur les bords du trottoir de la rue piétonne", "trash", "faible"),
    ("Il manque une corbeille à l'entrée du parc", "trash", "faible"),
    ("Proposition d'installer un composteur collectif dans le quartier", "trash", "faible"),
    ("Poubelle de la rue légèrement pleine mais pas encore débordante", "trash", "faible"),
    ("Feuilles mortes non balayées devant la médiathèque", "trash", "faible"),
    ("Quelques papiers gras laissés par des touristes sur la plage ce matin", "trash", "faible"),

    # ─── ROADS / normale (10) ─────────────────────────────────────────────────
    ("Nid de poule profond à l'entrée du rond-point, crève les pneus", "roads", "normale"),
    ("Le trottoir de la rue du marché est entièrement défoncé", "roads", "normale"),
    ("Marquage piéton effacé au carrefour de la poste", "roads", "normale"),
    ("Regard d'égout sans couvercle au milieu du trottoir depuis une semaine", "roads", "normale"),
    ("Route communale envahie par la végétation, visibilité réduite", "roads", "normale"),
    ("Glissière de sécurité manquante sur la route de la corniche", "roads", "normale"),
    ("Chaussée défoncée après les travaux de gaz, non réasphaltée", "roads", "normale"),
    ("Trottoir surélevé dangereux pour les personnes en fauteuil roulant", "roads", "normale"),
    ("Caniveau obstrué, eaux stagnantes après la pluie d'hier soir", "roads", "normale"),
    ("Panneau stop couché par le vent à l'intersection principale", "roads", "normale"),

    # ─── ROADS / urgente (8) ──────────────────────────────────────────────────
    ("Effondrement de chaussée suite aux pluies, voiture piégée dans le trou", "roads", "urgente"),
    ("Pont communal présentant des fissures profondes, à fermer d'urgence", "roads", "urgente"),
    ("Glissement de boue sur la route nationale, circulation impossible", "roads", "urgente"),
    ("Accident grave causé par regard ouvert, motard hospitalisé", "roads", "urgente"),
    ("Route inondée, courant fort emporte les voitures, personnes en danger", "roads", "urgente"),
    ("Chaussée effondrée sous un camion de livraison, chauffeur coincé", "roads", "urgente"),
    ("Rochers tombés sur la route littorale, accès au village coupé", "roads", "urgente"),
    ("Mur de soutènement s'effondre progressivement sur la route, fermer", "roads", "urgente"),

    # ─── ROADS / faible (9) ───────────────────────────────────────────────────
    ("Marquage au sol du parking légèrement effacé", "roads", "faible"),
    ("Il manque un miroir de sécurité au virage de la ruelle", "roads", "faible"),
    ("Suggestion d'installer un ralentisseur devant la mosquée", "roads", "faible"),
    ("La bordure du trottoir est un peu ébréchée mais praticable", "roads", "faible"),
    ("Proposition d'une piste cyclable entre le centre et la plage", "roads", "faible"),
    ("Revêtement de la place centrale un peu vieilli, à refaire à terme", "roads", "faible"),
    ("Fissures superficielles sur le trottoir, aucun risque pour l'instant", "roads", "faible"),
    ("Panneau de nom de rue illisible à cause de la rouille", "roads", "faible"),
    ("Les lignes de stationnement sont presque invisibles dans la zone bleue", "roads", "faible"),

    # ─── NOISE / normale (10) ─────────────────────────────────────────────────
    ("Le bar du port diffuse de la musique forte jusqu'à 3h du matin", "noise", "normale"),
    ("Chantier de rénovation du marché bruyant dès 6h du matin", "noise", "normale"),
    ("Les camions de livraison klaxonnent excessivement la nuit devant le supermarché", "noise", "normale"),
    ("Atelier de menuiserie voisin génère un bruit de scie incessant la journée", "noise", "normale"),
    ("Fête de mariage bruyante en semaine jusqu'à l'aube, enfants ne dorment pas", "noise", "normale"),
    ("Les motos circulent à plein régime dans la rue piétonne en soirée", "noise", "normale"),
    ("Voisin du dessus fait des travaux de carrelage le soir après 20h", "noise", "normale"),
    ("Terrasse de café très bruyante jusqu'à minuit devant des habitations", "noise", "normale"),
    ("Aboiements persistants d'une meute de chiens errants la nuit", "noise", "normale"),
    ("Klaxonnage continu près du lycée aux heures de sortie", "noise", "normale"),

    # ─── NOISE / urgente (8) ──────────────────────────────────────────────────
    ("Détonation entendue dans la rue, possible coup de feu, panique", "noise", "urgente"),
    ("Alarme incendie de l'école sonne sans interruption depuis une heure", "noise", "urgente"),
    ("Cris de détresse et bruit de violence dans l'appartement du dessus", "noise", "urgente"),
    ("Explosion sourde dans la rue industrielle, fumée noire visible", "noise", "urgente"),
    ("Bruits de craquements dans les murs de l'immeuble, risque effondrement", "noise", "urgente"),
    ("Bruit d'une collision grave sur le carrefour, plusieurs blessés", "noise", "urgente"),
    ("Alarme de fuite gaz déclenchée dans l'immeuble, évacuation nécessaire", "noise", "urgente"),
    ("Tirs entendus dans le quartier, habitants terrifiés, intervention urgente", "noise", "urgente"),

    # ─── NOISE / faible (8) ───────────────────────────────────────────────────
    ("Le ventilateur du commerce voisin fait un léger bourdonnement", "noise", "faible"),
    ("Bruit de fontaine dans le jardin du voisin, peu gênant", "noise", "faible"),
    ("Le camion poubelle passe tôt le matin, bruit acceptable", "noise", "faible"),
    ("Suggestion d'installer des panneaux acoustiques dans la salle des fêtes", "noise", "faible"),
    ("Enfants qui jouent dans la cour, bruit normal et ponctuel", "noise", "faible"),
    ("Légère nuisance du générateur d'une boutique en journée", "noise", "faible"),
    ("Le carillon de l'église sonne le matin, peu dérangeant", "noise", "faible"),
    ("Bruit de circulation acceptable mais qu'on pourrait réduire avec un terre-plein", "noise", "faible"),

    # ─── OTHER / normale (10) ─────────────────────────────────────────────────
    ("Fuite sur le réseau d'eau potable, flaque permanente dans la rue", "other", "normale"),
    ("Banc public cassé dans la zone piétonne depuis trois semaines", "other", "normale"),
    ("Les feux tricolores du carrefour central sont en panne", "other", "normale"),
    ("Arbre menaçant de tomber sur le trottoir fréquenté", "other", "normale"),
    ("Aire de jeux dégradée, balançoires rouillées et bords tranchants", "other", "normale"),
    ("Le local poubelle du cimetière déborde et n'est pas entretenu", "other", "normale"),
    ("Graffitis couvrent le mur de la bibliothèque municipale", "other", "normale"),
    ("La fontaine d'eau potable du parc est hors service", "other", "normale"),
    ("Tuyau apparent et rouillé sur la façade de la mairie", "other", "normale"),
    ("Portail du jardin public cassé, impossible à fermer la nuit", "other", "normale"),

    # ─── OTHER / urgente (10) ─────────────────────────────────────────────────
    ("Fuite de gaz très forte dans la cave d'un immeuble, odeur envahit le hall", "other", "urgente"),
    ("Incendie déclaré dans une maison du quartier, flammes visibles", "other", "urgente"),
    ("Enfant coincé dans l'ascenseur scolaire depuis 30 minutes, pleure", "other", "urgente"),
    ("Mur de clôture effondré sur un passant, personne blessée au sol", "other", "urgente"),
    ("Inondation rapide du sous-sol, eau monte, personnes piégées", "other", "urgente"),
    ("Personne inconsciente sur le trottoir depuis plusieurs minutes, secours absents", "other", "urgente"),
    ("Rupture d'une canalisation principale, geyser d'eau bouillante dans la rue", "other", "urgente"),
    ("Arbre arraché par la tempête écrase une voiture, conducteur blessé", "other", "urgente"),
    ("Noyade sur la plage municipale, baigneur en détresse visible", "other", "urgente"),
    ("Rixe grave avec blessés devant l'école, enfants témoins, police nécessaire", "other", "urgente"),

    # ─── OTHER / faible (9) ───────────────────────────────────────────────────
    ("Le banc du parc mériterait une couche de peinture", "other", "faible"),
    ("Suggestion de planter des palmiers sur l'avenue touristique", "other", "faible"),
    ("Il serait agréable d'avoir des toilettes publiques près de la plage", "other", "faible"),
    ("La signalétique touristique du centre-ville est vieillotte", "other", "faible"),
    ("Proposition d'un espace de co-working dans la médiathèque", "other", "faible"),
    ("Le terrain de pétanque du parc est en mauvais état, à rénover", "other", "faible"),
    ("Il manque un distributeur de sacs pour les déjections canines", "other", "faible"),
    ("La façade de la mairie mériterait un ravalement esthétique", "other", "faible"),
    ("Suggestion d'organiser un marché artisanal hebdomadaire en été", "other", "faible"),

    # ─── ARABIC EXPANSION (10 mixed) ──────────────────────────────────────────
    ("عمود الإنارة مكسور في الشارع منذ أسبوعين ما جاش أحد يصلحه", "lighting", "normale"),
    ("أسلاك كهرباء متدلية بعد العاصفة خطر على المارة", "lighting", "urgente"),
    ("الزبالة ما تجمعتش من خمسة أيام والروايح انتشرت في الحي", "trash", "normale"),
    ("حريق في حاوية القمامة بجانب البناية السكنية خطر عاجل", "trash", "urgente"),
    ("الطريق فيها حفر كثيرة تضر بالسيارات وتسبب الحوادث", "roads", "normale"),
    ("انهيار جزء من الطريق بعد الأمطار وسيارة وقعت في الحفرة", "roads", "urgente"),
    ("الجيران يصنعوا ضجة كل ليلة ويمنعوا النوم", "noise", "normale"),
    ("سمعنا صوت انفجار في الحارة وما نعرفوش الأصل خطر", "noise", "urgente"),
    ("تسرب ماء في الشارع الرئيسي منذ أيام ضياع في الماء", "other", "normale"),
    ("ريحة غاز قوية تنبعث من الطابق السفلي للعمارة خطر انفجار", "other", "urgente"),
]
