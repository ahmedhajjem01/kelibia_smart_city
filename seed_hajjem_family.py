import os, django, random
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from extrait_naissance.models import Citoyen, ExtraitNaissance
from extrait_mariage.models import ExtraitMariage
from extrait_deces.models import ExtraitDeces
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

def create_citoyen(prenom_fr, prenom_ar, nom_fr, nom_ar, date_n, sexe, pere=None, mere=None, cin=None):
    n_ec = f"{random.randint(1000, 9999)}/{date_n.year}"
    citoyen = Citoyen.objects.create(
        n_etat_civil=n_ec,
        cin=cin,
        prenom_fr=prenom_fr,
        prenom_ar=prenom_ar,
        nom_fr=nom_fr,
        nom_ar=nom_ar,
        date_naissance=date_n,
        lieu_naissance_fr="Kelibia",
        lieu_naissance_ar="قليبية",
        sexe=sexe,
        pere=pere,
        mere=mere
    )
    
    # Create Birth Certificate
    ExtraitNaissance.objects.create(
        titulaire=citoyen,
        annee_acte=date_n.year,
        numero_registre=n_ec.split('/')[0],
        date_declaration=timezone.make_aware(django.utils.timezone.datetime(date_n.year, date_n.month, date_n.day, 10, 0)),
        officer_etat_civil_fr="Mohsen Bahri",
        officer_etat_civil_ar="محسن البحري"
    )
    return citoyen

def create_mariage(epoux, epouse, date_m):
    return ExtraitMariage.objects.create(
        epoux=epoux,
        epouse=epouse,
        date_mariage=date_m,
        date_mariage_lettres_fr="Vingt-deux juillet deux mille",
        date_mariage_lettres_ar="اثنان وعشرون جويلية ألفين",
        lieu_mariage_fr="Kelibia",
        lieu_mariage_ar="قليبية",
        numero_registre=str(random.randint(1, 500)),
        annee_acte=date_m.year,
        officer_etat_civil_fr="Mohsen Bahri",
        officer_etat_civil_ar="محسن البحري"
    )

def create_deces(citoyen, date_d):
    return ExtraitDeces.objects.create(
        defunt=citoyen,
        date_deces=date_d,
        lieu_deces_fr="Kelibia",
        lieu_deces_ar="قليبية",
        numero_registre=str(random.randint(1, 500)),
        annee_acte=date_d.year,
        declarant_fr="Membre de la famille",
        declarant_ar="فرد من العائلة",
        officer_etat_civil_fr="Mohsen Bahri",
        officer_etat_civil_ar="محسن البحري"
    )

def seed_hajjem():
    # Cleanup existing Hajjem records if any
    Citoyen.objects.filter(nom_fr__icontains='Hajjem').delete()
    Citoyen.objects.filter(nom_fr__icontains='Ben Said').delete()
    
    # 1. Grandparents (Father side)
    ali = create_citoyen("Ali", "علي", "Hajjem", "حجام", date(1940, 5, 10), 'M', cin="01234567")
    zohra = create_citoyen("Zohra", "زهرة", "Hajjem", "حجام", date(1945, 8, 20), 'F', cin="02345678")
    create_mariage(ali, zohra, date(1965, 6, 15))
    # create_deces(ali, date(2015, 3, 12)) # Removed for future declaration service test

    # 2. Grandparents (Mother side - parents of mother)
    moncef = create_citoyen("Moncef", "منصف", "Ben Said", "بن سعيد", date(1950, 2, 5), 'M', cin="03456789")
    fatma = create_citoyen("Fatma", "فاطمة", "Ben Said", "بن سعيد", date(1955, 11, 30), 'F', cin="04567890")
    create_mariage(moncef, fatma, date(1975, 4, 10))

    # 3. Mother's Grandparents (GGF/GGM of test user)
    hassen = create_citoyen("Hassen", "حسان", "Ben Said", "بن سعيد", date(1920, 1, 1), 'M')
    saloua = create_citoyen("Saloua", "سلوى", "Ben Said", "بن سعيد", date(1925, 1, 1), 'F')
    create_mariage(hassen, saloua, date(1945, 1, 1))
    # create_deces(hassen, date(1995, 1, 1)) # Removed
    # create_deces(saloua, date(2000, 1, 1)) # Removed
    
    # Link Moncef to his parents Hassen/Saloua
    moncef.pere = hassen
    moncef.mere = saloua
    moncef.save()

    # 4. The Test User: Ahmed Hajjem
    ahmed = create_citoyen("Ahmed", "أحمد", "Hajjem", "حجام", date(1970, 12, 12), 'M', pere=ali, mere=zohra, cin="03584312")
    
    # 5. Mother: Leila Ben Said
    leila = create_citoyen("Leila", "ليلى", "Ben Said", "بن سعيد", date(1975, 3, 20), 'F', pere=moncef, mere=fatma, cin="05678901")
    
    # Marriage Ahmed & Leila
    create_mariage(ahmed, leila, date(2000, 7, 22))

    # 6. Children
    sami = create_citoyen("Sami", "سامي", "Hajjem", "حجام", date(2005, 9, 14), 'M', pere=ahmed, mere=leila)
    ines = create_citoyen("Ines", "إيناس", "Hajjem", "حجام", date(2010, 5, 5), 'F', pere=ahmed, mere=leila)

    # 7. Update User Account
    user, _ = CustomUser.objects.get_or_create(email='citizen@kelibia.tn')
    user.cin = ahmed.cin
    user.first_name = ahmed.prenom_fr
    user.last_name = ahmed.nom_fr
    user.set_password('Kelibia2026!')
    user.save()

    print(f"Realistic Hajjem family seeded for user {user.email}")
    print(f"Relationships: {ahmed} (User) has children {sami}, {ines} and deceased father {ali}.")

if __name__ == "__main__":
    seed_hajjem()
