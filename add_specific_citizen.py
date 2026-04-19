import os
import django
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Define the path to the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django
django.setup()

from extrait_naissance.models import Citoyen, ExtraitNaissance
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

def add_citizen():
    cin_target = "12545655"
    
    # 1. Check if user exists in the portal
    portal_user = User.objects.filter(cin=cin_target).first()
    if portal_user:
        print(f"Found portal user: {portal_user.email}")
    else:
        print("Note: No portal user found with this CIN yet.")

    # 2. Create Citoyen in Etat Civil
    citoyen, created = Citoyen.objects.get_or_create(
        cin=cin_target,
        defaults={
            "n_etat_civil": "1998/4565",
            "prenom_ar": "دالي",
            "prenom_fr": "dali",
            "nom_ar": "دالي",
            "nom_fr": "dali",
            "date_naissance": "1998-06-11",
            "date_naissance_lettres_ar": "أحد عشر جوان ثمانية وتسعون وتسعمائة وألف",
            "date_naissance_lettres_fr": "Onze juin mille neuf cent quatre-vingt-dix-huit",
            "lieu_naissance_ar": "قليبية",
            "lieu_naissance_fr": "Kelibia",
            "sexe": "M",
            "profession_ar": "طالب",
            "profession_fr": "Étudiant",
        }
    )

    if created:
        print(f"SUCCESS: Citoyen record created in Etat Civil: {citoyen}")
    else:
        print(f"INFO: Citoyen already exists: {citoyen}")

    # 3. Create ExtraitNaissance
    # We create one that is automatically linked if the user exists
    extrait, created = ExtraitNaissance.objects.get_or_create(
        titulaire=citoyen,
        annee_acte=1998,
        numero_registre="4565",
        defaults={
            "user": portal_user,
            "date_declaration": timezone.make_aware(timezone.datetime(1998, 6, 12, 10, 0)),
            "declarant_ar": "الأب",
            "declarant_fr": "Le père",
            "officer_etat_civil_ar": "بلدية قليبية",
            "officer_etat_civil_fr": "Municipalité de Kélibia",
            "is_paid": True, # For testing purposes
        }
    )

    if created:
        print(f"SUCCESS: Extrait de Naissance record created: {extrait}")
    else:
        # If it exists, update the user link if it was missing
        if portal_user and not extrait.user:
            extrait.user = portal_user
            extrait.save()
            print(f"SUCCESS: Extrait linked to portal user {portal_user.email}")
        print(f"INFO: Extrait recording done.")

if __name__ == "__main__":
    add_citizen()
