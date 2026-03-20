import os
import django
from datetime import date, datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from extrait_naissance.models import Citoyen
from extrait_mariage.models import ExtraitMariage
from django.contrib.auth import get_user_model

User = get_user_model()

def create_dummy_wedding():
    print("Creating dummy wedding certificate...")
    
    # Get or create a user for linking
    user = User.objects.first()
    
    # Create Father/Mother for Groom
    gp1 = Citoyen.objects.create(
        n_etat_civil="G-FAT-001", prenom_ar="أحمد", prenom_fr="Ahmed", nom_ar="الهمامي", nom_fr="Hammami",
        date_naissance=date(1960, 5, 12), lieu_naissance_ar="تونس", lieu_naissance_fr="Tunis", sexe='M'
    )
    gp2 = Citoyen.objects.create(
        n_etat_civil="G-MOT-001", prenom_ar="فاطمة", prenom_fr="Fatma", nom_ar="الهمامي", nom_fr="Hammami",
        date_naissance=date(1965, 8, 20), lieu_naissance_ar="صفاقس", lieu_naissance_fr="Sfax", sexe='F'
    )
    
    # Create Groom
    epoux = Citoyen.objects.create(
        n_etat_civil="G-001", cin="12345678", prenom_ar="محمد", prenom_fr="Mohamed", nom_ar="الهمامي", nom_fr="Hammami",
        date_naissance=date(1990, 3, 15), lieu_naissance_ar="قليبية", lieu_naissance_fr="Kelibia", sexe='M',
        pere=gp1, mere=gp2
    )

    # Create Father/Mother for Bride
    bp1 = Citoyen.objects.create(
        n_etat_civil="B-FAT-001", prenom_ar="علي", prenom_fr="Ali", nom_ar="بن صالح", nom_fr="Ben Salah",
        date_naissance=date(1962, 1, 10), lieu_naissance_ar="سوسة", lieu_naissance_fr="Sousse", sexe='M'
    )
    bp2 = Citoyen.objects.create(
        n_etat_civil="B-MOT-001", prenom_ar="مريم", prenom_fr="Maryam", nom_ar="بن صالح", nom_fr="Ben Salah",
        date_naissance=date(1968, 11, 25), lieu_naissance_ar="نابل", lieu_naissance_fr="Nabeul", sexe='F'
    )

    # Create Bride
    epouse = Citoyen.objects.create(
        n_etat_civil="B-001", cin="87654321", prenom_ar="ليلى", prenom_fr="Leila", nom_ar="بن صالح", nom_fr="Ben Salah",
        date_naissance=date(1993, 7, 22), lieu_naissance_ar="قليبية", lieu_naissance_fr="Kelibia", sexe='F',
        pere=bp1, mere=bp2
    )

    # Create Wedding Certificate
    extracted_mariage = ExtraitMariage.objects.create(
        user=user,
        epoux=epoux,
        epouse=epouse,
        annee_acte=2023,
        numero_registre="245",
        date_mariage=date(2023, 6, 15),
        date_mariage_lettres_ar="الخامس عشر من جوان ألفين وثلاثة وعشرون",
        date_mariage_lettres_fr="Quinze Juin Deux Mille Vingt-Trois",
        lieu_mariage_ar="قليبية",
        lieu_mariage_fr="Kelibia",
        regime_matrimonial='separation',
        officer_etat_civil_ar="محسن البحري",
        officer_etat_civil_fr="Mohsen Bahri",
        numero_ordre="1024",
        prix=2.000,
        observations_ar="نظام تفرقة الأملاك",
        observations_fr="Régime de séparation des biens"
    )

    print(f"Wedding certificate created with ID: {extracted_mariage.id}")
    return extracted_mariage.id

if __name__ == "__main__":
    create_dummy_wedding()
