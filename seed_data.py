"""
seed_data.py — Données de démonstration réalistes pour Kélibia Smart City
---------------------------------------------------------------------------
Crée :
  • 3 agents municipaux
  • 12 citoyens kélibiens
  • 30 réclamations variées (catégories, statuts, coords GPS réels Kélibia)
  • 1 superadmin (si absent)

Usage :
    python seed_data.py           -> ajoute si absent (safe à relancer)
    python seed_data.py --reset   -> vide d'abord les reclamations + comptes de test
"""

import os
import sys
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
os.environ.setdefault('PGCLIENTENCODING', 'UTF8')
django.setup()

from django.contrib.auth import get_user_model
from reclamations.models import Reclamation

User = get_user_model()

# --- RESET OPTIONNEL -----------------------------------------------------------
RESET = '--reset' in sys.argv
if RESET:
    deleted_r = Reclamation.objects.filter(
        citizen__email__in=[f'citoyen{i}@kelibia.tn' for i in range(1, 13)]
    ).delete()
    deleted_u = User.objects.filter(
        email__in=(
            [f'citoyen{i}@kelibia.tn' for i in range(1, 13)] +
            [f'agent{i}@mairie-kelibia.tn' for i in range(1, 4)]
        )
    ).delete()
    print(f'[OK] Reset : {deleted_r[0]} réclamations + {deleted_u[0]} comptes supprimés')


# --- 1. SUPERADMIN -------------------------------------------------------------
admin, created = User.objects.get_or_create(
    email='admin@mairie-kelibia.tn',
    defaults=dict(
        username='admin_kelibia',
        first_name='Administrateur',
        last_name='Commune',
        cin='00000001',
        phone='71000001',
        address='Hôtel de Ville, Avenue Habib Bourguiba, Kélibia',
        governorate='Nabeul',
        city='Kelibia',
        user_type='citizen',
        is_staff=True,
        is_superuser=True,
        is_verified=True,
        is_active=True,
    )
)
if created:
    admin.set_password('Admin@Kelibia2025')
    admin.save()
    print('[OK] Superadmin créé  ->  admin@mairie-kelibia.tn  /  Admin@Kelibia2025')
else:
    print('[-] Superadmin déjà existant')


# --- 2. AGENTS MUNICIPAUX ------------------------------------------------------
AGENTS_DATA = [
    dict(
        email='agent1@mairie-kelibia.tn',
        username='agent_ben_ali',
        first_name='Mohamed Ali',
        last_name='Ben Ali',
        cin='09123456',
        phone='22111001',
        address='Rue de la République, Kélibia',
    ),
    dict(
        email='agent2@mairie-kelibia.tn',
        username='agent_trabelsi',
        first_name='Fatma',
        last_name='Trabelsi',
        cin='09234567',
        phone='22111002',
        address='Avenue Farhat Hached, Kélibia',
    ),
    dict(
        email='agent3@mairie-kelibia.tn',
        username='agent_chabbi',
        first_name='Youssef',
        last_name='Chabbi',
        cin='09345678',
        phone='22111003',
        address='Rue Ibn Khaldoun, Kélibia',
    ),
]

agents = []
for d in AGENTS_DATA:
    u, created = User.objects.get_or_create(
        email=d['email'],
        defaults=dict(
            **d,
            governorate='Nabeul',
            city='Kelibia',
            user_type='agent',
            is_verified=True,
            is_active=True,
        )
    )
    if created:
        u.set_password('Agent@2025!')
        u.save()
        print(f'[OK] Agent créé      ->  {d["email"]}  /  Agent@2025!')
    else:
        print(f'[-] Agent déjà existant : {d["email"]}')
    agents.append(u)


# --- 3. CITOYENS ---------------------------------------------------------------
CITIZENS_DATA = [
    dict(first_name='Sana',       last_name='Mejri',      cin='09456001', phone='55001001', address='Rue des Artisans, Kélibia'),
    dict(first_name='Khaled',     last_name='Hamdi',      cin='09456002', phone='55001002', address='Avenue Habib Bourguiba, Kélibia'),
    dict(first_name='Meriem',     last_name='Boughanmi',  cin='09456003', phone='55001003', address='Route de la Corniche, Kélibia'),
    dict(first_name='Bilel',      last_name='Ferchichi',  cin='09456004', phone='55001004', address='Cité Erriadh, Kélibia'),
    dict(first_name='Amira',      last_name='Saidi',      cin='09456005', phone='55001005', address='Quartier El Amel, Kélibia'),
    dict(first_name='Nabil',      last_name='Belhaj',     cin='09456006', phone='55001006', address='Route GP1, Kélibia'),
    dict(first_name='Ines',       last_name='Cherif',     cin='09456007', phone='55001007', address='Zone Résidentielle Nord, Kélibia'),
    dict(first_name='Rami',       last_name='Nasri',      cin='09456008', phone='55001008', address='Rue Ibn Khaldoun, Kélibia'),
    dict(first_name='Hajer',      last_name='Kouki',      cin='09456009', phone='55001009', address='Route de Menzel Temime, Kélibia'),
    dict(first_name='Seifeddine', last_name='Maaroufi',   cin='09456010', phone='55001010', address='Avenue Farhat Hached, Kélibia'),
    dict(first_name='Leila',      last_name='Gharbi',     cin='09456011', phone='55001011', address='Cité des Oliviers, Kélibia'),
    dict(first_name='Tarek',      last_name='Zouari',     cin='09456012', phone='55001012', address='Rue de la Médina, Kélibia'),
]

citizens = []
for i, d in enumerate(CITIZENS_DATA, start=1):
    email = f'citoyen{i}@kelibia.tn'
    u, created = User.objects.get_or_create(
        email=email,
        defaults=dict(
            username=f'citoyen_{d["last_name"].lower()}_{i}',
            **d,
            governorate='Nabeul',
            city='Kelibia',
            user_type='citizen',
            is_verified=True,
            is_active=True,
        )
    )
    if created:
        u.set_password('Citoyen@2025!')
        u.save()
        print(f'[OK] Citoyen créé    ->  {email}  /  Citoyen@2025!')
    else:
        print(f'[-] Citoyen déjà existant : {email}')
    citizens.append(u)


# --- 4. RÉCLAMATIONS RÉALISTES -------------------------------------------------
# Coordonnées GPS réelles dans Kélibia (WGS84)
KELIBIA_LOCATIONS = [
    (36.8530, 11.0920, "Rue Ibn Khaldoun"),
    (36.8467, 11.0870, "Avenue Habib Bourguiba — centre"),
    (36.8475, 11.1050, "Avenue Habib Bourguiba — est"),
    (36.8600, 11.0820, "Route de la Corniche — nord"),
    (36.8540, 11.0940, "Route de la Corniche — centre"),
    (36.8420, 11.0700, "Route GP1 — entrée ville"),
    (36.8460, 11.0940, "Route GP1 — centre"),
    (36.8490, 11.0850, "Rue des Artisans"),
    (36.8610, 11.0900, "Zone Port & Plage"),
    (36.8650, 11.0950, "Plage de Kélibia"),
    (36.8380, 11.0580, "Zone Industrielle — sud"),
    (36.8350, 11.0620, "Zone Agricole — ouest"),
    (36.8500, 11.1000, "Quartier Résidentiel Nord"),
    (36.8520, 11.0800, "Cité Erriadh"),
    (36.8440, 11.0760, "Cité El Amel"),
    (36.8570, 11.0880, "Route Corniche — belvédère"),
    (36.8460, 11.0820, "Centre-Ville — marché"),
    (36.8480, 11.0960, "Quartier El Menzah"),
    (36.8410, 11.0650, "Route de Menzel Temime"),
    (36.8550, 11.0840, "Rue Farhat Hached"),
]

# 30 réclamations réalistes pour Kélibia
RECLAMATIONS_DATA = [
    # -- ÉCLAIRAGE PUBLIC --------------------------------------
    dict(
        title="Lampadaire hors service — Rue Ibn Khaldoun",
        description="Le lampadaire au croisement de la rue Ibn Khaldoun et de la rue des Artisans ne fonctionne plus depuis 3 jours. La zone est très sombre la nuit et constitue un risque pour les piétons.",
        category='lighting', status='pending',
        loc_idx=0, days_ago=2,
    ),
    dict(
        title="Éclairage défaillant — Avenue Habib Bourguiba",
        description="Plusieurs lampadaires sur l'avenue principale sont éteints depuis une semaine. La visibilité est mauvaise entre 20h et 6h du matin. Problème signalé par plusieurs riverains.",
        category='lighting', status='in_progress', agent_idx=0,
        loc_idx=1, days_ago=7,
    ),
    dict(
        title="Panneau lumineux cassé — entrée de ville",
        description="Le panneau de signalisation lumineux à l'entrée de Kélibia (côté GP1) est cassé. Les câbles sont visibles et représentent un danger électrique.",
        category='lighting', status='resolved', agent_idx=1,
        loc_idx=5, days_ago=14,
    ),
    dict(
        title="Lampes éteintes — Route de la Corniche",
        description="La portion de la route de la Corniche entre le port et la plage principale est plongée dans le noir. Dangereux pour les promeneurs et les cyclistes.",
        category='lighting', status='pending',
        loc_idx=3, days_ago=1,
    ),
    dict(
        title="Éclairage intermittent — Cité Erriadh",
        description="Les lampadaires de la Cité Erriadh clignotent et s'éteignent par intermittence. Le problème date d'environ deux semaines et s'aggrave.",
        category='lighting', status='in_progress', agent_idx=2,
        loc_idx=13, days_ago=12,
    ),

    # -- DÉCHETS / HYGIÈNE -------------------------------------
    dict(
        title="Poubelles débordantes — marché central",
        description="Les bacs à ordures devant le marché central n'ont pas été vidés depuis 4 jours. Les déchets se répandent sur la chaussée et dégagent des odeurs nauséabondes.",
        category='trash', status='resolved', agent_idx=0,
        loc_idx=16, days_ago=10,
    ),
    dict(
        title="Dépôt sauvage de déchets — Zone industrielle",
        description="Un dépôt sauvage de déchets ménagers et de gravats a été constitué en bordure de la zone industrielle. Environ 5 tonnes de déchets non triés.",
        category='trash', status='in_progress', agent_idx=1,
        loc_idx=10, days_ago=5,
    ),
    dict(
        title="Déchets sur la plage — Plage de Kélibia",
        description="La plage principale de Kélibia est souillée par des déchets plastiques laissés par des visiteurs du week-end. Urgence avant la saison touristique.",
        category='trash', status='pending',
        loc_idx=9, days_ago=1,
    ),
    dict(
        title="Conteneurs absents — Quartier Résidentiel Nord",
        description="Il n'y a aucun conteneur à ordures dans le nouveau quartier résidentiel nord depuis 3 semaines. Les résidents sont contraints de déposer leurs déchets sur le trottoir.",
        category='trash', status='pending',
        loc_idx=12, days_ago=3,
    ),
    dict(
        title="Mauvaises odeurs — Port de pêche",
        description="Des odeurs très fortes de poisson et de déchets organiques émanent du port depuis plusieurs jours. Les riverains de la Corniche se plaignent.",
        category='trash', status='in_progress', agent_idx=2,
        loc_idx=8, days_ago=6,
    ),

    # -- VOIRIE / ROUTES ---------------------------------------
    dict(
        title="Nid-de-poule dangereux — Avenue Habib Bourguiba",
        description="Un nid-de-poule de grande taille (environ 50cm de diamètre et 15cm de profondeur) s'est formé sur la voie principale. Plusieurs véhicules ont déjà subi des dommages.",
        category='roads', status='in_progress', agent_idx=0,
        loc_idx=2, days_ago=8,
    ),
    dict(
        title="Route dégradée — Route GP1 entrée ville",
        description="La chaussée est très dégradée sur environ 200 mètres à l'entrée de Kélibia. Des fissures profondes rendent la route dangereuse, surtout par temps de pluie.",
        category='roads', status='pending',
        loc_idx=5, days_ago=4,
    ),
    dict(
        title="Trottoir effondré — Rue des Artisans",
        description="Une portion du trottoir de la rue des Artisans s'est effondrée suite aux pluies. Un piéton a failli tomber. La zone n'est pas balisée.",
        category='roads', status='resolved', agent_idx=1,
        loc_idx=7, days_ago=20,
    ),
    dict(
        title="Signalisation routière absente — Carrefour Corniche",
        description="Le panneau stop au carrefour de la route de la Corniche a disparu (probablement arraché). Risque d'accident important à ce croisement.",
        category='roads', status='pending',
        loc_idx=4, days_ago=2,
    ),
    dict(
        title="Glissière de sécurité endommagée — Route côtière",
        description="La glissière de sécurité longeant la route côtière est tordue et enfoncée sur une vingtaine de mètres suite à un accident. Danger pour les véhicules.",
        category='roads', status='in_progress', agent_idx=2,
        loc_idx=3, days_ago=9,
    ),
    dict(
        title="Marquage au sol effacé — Passage piétons GP1",
        description="Le marquage du passage piéton sur la route GP1 est complètement effacé. Les piétons, notamment les enfants allant à l'école, traversent sans visibilité.",
        category='roads', status='pending',
        loc_idx=6, days_ago=15,
    ),

    # -- NUISANCES SONORES -------------------------------------
    dict(
        title="Musique forte — Café Corniche",
        description="Le café situé sur la corniche diffuse de la musique à fort volume jusqu'à 2h du matin plusieurs soirs par semaine. Les riverains ne peuvent pas dormir.",
        category='noise', status='in_progress', agent_idx=0,
        loc_idx=15, days_ago=3,
    ),
    dict(
        title="Chantier bruyant de nuit — Cité El Amel",
        description="Des travaux de construction se poursuivent jusqu'à minuit passé dans la Cité El Amel. Les marteaux-piqueurs et les bétonnières perturbent le sommeil de tout le quartier.",
        category='noise', status='pending',
        loc_idx=14, days_ago=5,
    ),
    dict(
        title="Klaxons excessifs — Marché du matin",
        description="Les vendeurs ambulants et les camions de livraison au marché klaxonnent de manière excessive dès 5h du matin, réveillant tout le quartier.",
        category='noise', status='resolved', agent_idx=1,
        loc_idx=16, days_ago=18,
    ),

    # -- AUTRES ------------------------------------------------
    dict(
        title="Canalisation percée — Rue Farhat Hached",
        description="Une fuite d'eau importante est visible sur le trottoir de la rue Farhat Hached. L'eau coule en permanence depuis 2 jours et crée des risques de glissade.",
        category='other', status='in_progress', agent_idx=2,
        loc_idx=19, days_ago=2,
    ),
    dict(
        title="Arbre dangereux — Quartier El Menzah",
        description="Un grand arbre penche dangereusement au-dessus de la voie publique dans le quartier El Menzah. Des branches sont tombées suite aux derniers vents. Risque d'accident.",
        category='other', status='pending',
        loc_idx=17, days_ago=1,
    ),
    dict(
        title="Vandalisme — Parc municipal",
        description="Les bancs et les jeux pour enfants du parc municipal ont été vandalisés. Plusieurs équipements sont cassés et dangereux pour les enfants.",
        category='other', status='in_progress', agent_idx=0,
        loc_idx=1, days_ago=6,
    ),
    dict(
        title="Égoût bouché — Cité Erriadh",
        description="L'égout de la rue principale de la Cité Erriadh est complètement bouché. Les eaux usées remontent sur la chaussée et créent une situation sanitaire préoccupante.",
        category='other', status='resolved', agent_idx=1,
        loc_idx=13, days_ago=25,
    ),
    dict(
        title="Feux de signalisation en panne — Centre-ville",
        description="Le feu tricolore au carrefour central est en panne depuis ce matin. La circulation est très difficile aux heures de pointe.",
        category='other', status='in_progress', agent_idx=2,
        loc_idx=1, days_ago=0,
    ),
    dict(
        title="Terrain vague avec déchets — Zone agricole",
        description="Un terrain vague à la sortie de la ville (direction Menzel Temime) est utilisé comme décharge sauvage. Des pneus, électroménagers et déchets ménagers s'y accumulent.",
        category='trash', status='rejected', agent_idx=0,
        loc_idx=11, days_ago=30,
    ),
    dict(
        title="Éclairage absent — Nouveau lotissement",
        description="Aucun lampadaire n'a encore été installé dans le nouveau lotissement à l'est de la ville. Les résidents vivent dans l'obscurité totale depuis leur emménagement il y a 2 mois.",
        category='lighting', status='in_progress', agent_idx=1,
        loc_idx=18, days_ago=20,
    ),
    dict(
        title="Route inondable — Passage bas GP1",
        description="Le passage bas sur la GP1 est régulièrement inondé lors des pluies, coupant l'accès à plusieurs quartiers pendant des heures. Un réseau de drainage est nécessaire.",
        category='roads', status='pending',
        loc_idx=5, days_ago=3,
    ),
    dict(
        title="Clôture effondrée — École primaire",
        description="La clôture extérieure de l'école primaire du centre-ville est effondrée sur environ 10 mètres. Les enfants peuvent accéder à la voie publique sans surveillance.",
        category='other', status='resolved', agent_idx=2,
        loc_idx=1, days_ago=35,
    ),
    dict(
        title="Bac à ordures incendié — Route de la Corniche",
        description="Un bac à ordures a été incendié sur la route de la Corniche. Les débris brûlés occupent une partie de la chaussée et dégagent une odeur de brûlé.",
        category='trash', status='in_progress', agent_idx=0,
        loc_idx=4, days_ago=4,
    ),
    dict(
        title="Nuisance sonore — Atelier de mécanique",
        description="Un atelier de mécanique situé en zone résidentielle fonctionne le week-end et jusqu'à 22h en semaine. Le bruit des outils est insupportable pour les voisins.",
        category='noise', status='pending',
        loc_idx=7, days_ago=7,
    ),
]


# --- CRÉATION DES RÉCLAMATIONS -------------------------------------------------
created_count = 0
skipped_count = 0

for i, r in enumerate(RECLAMATIONS_DATA):
    citizen = citizens[i % len(citizens)]
    lat, lng, _ = KELIBIA_LOCATIONS[r['loc_idx']]

    # Vérifier si déjà existant (par titre + citoyen)
    if Reclamation.objects.filter(title=r['title'], citizen=citizen).exists():
        skipped_count += 1
        continue

    agent = agents[r['agent_idx']] if 'agent_idx' in r else None
    created_at = timezone.now() - timedelta(days=r.get('days_ago', 0), hours=random.randint(0, 23))

    rec = Reclamation(
        citizen=citizen,
        agent=agent,
        title=r['title'],
        description=r['description'],
        category=r['category'],
        status=r['status'],
        latitude=lat,
        longitude=lng,
        created_at=created_at,
        updated_at=created_at if r['status'] == 'pending' else (created_at + timedelta(hours=random.randint(2, 48))),
    )
    # Bypass auto_now_add
    rec.save()
    # Fix timestamps manually
    Reclamation.objects.filter(pk=rec.pk).update(created_at=created_at)

    created_count += 1


# --- RÉSUMÉ --------------------------------------------------------------------
print()
print('=' * 58)
print('  SEED TERMINÉ — Kélibia Smart City')
print('=' * 58)
print(f'  Réclamations créées   : {created_count}')
print(f'  Réclamations ignorées : {skipped_count} (déjà existantes)')
print()
print('  COMPTES DE TEST :')
print('  +-----------------------------------------------------+')
print('  | SUPERADMIN                                          |')
print('  |   admin@mairie-kelibia.tn   /  Admin@Kelibia2025   |')
print('  +-----------------------------------------------------+')
print('  | AGENTS (x3)                                         |')
print('  |   agent1@mairie-kelibia.tn  /  Agent@2025!          |')
print('  |   agent2@mairie-kelibia.tn  /  Agent@2025!          |')
print('  |   agent3@mairie-kelibia.tn  /  Agent@2025!          |')
print('  +-----------------------------------------------------+')
print('  | CITOYENS (x12)                                      |')
print('  |   citoyen1@kelibia.tn  ->  citoyen12@kelibia.tn     |')
print('  |   Mot de passe : Citoyen@2025!                      |')
print('  +-----------------------------------------------------+')
print()

# Stats
from collections import Counter
statuses = Counter(Reclamation.objects.values_list('status', flat=True))
cats     = Counter(Reclamation.objects.values_list('category', flat=True))
gps_ok   = Reclamation.objects.exclude(latitude__isnull=True).count()
print(f'  TOTAL DB : {Reclamation.objects.count()} réclamations, {gps_ok} avec GPS')
print(f'  Statuts  : {dict(statuses)}')
print(f'  Catégor. : {dict(cats)}')
print()
