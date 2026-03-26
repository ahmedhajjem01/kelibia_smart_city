import os, django
from typing import Optional
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from extrait_naissance.models import Citoyen

CustomUser = get_user_model()

# Trouve un citoyen (Père) qui a des enfants enregistrés
pere = Citoyen.objects.filter(enfants_pere__isnull=False).first()

# IMPORTANT: évite d'avoir des identifiants en dur dans le code.
test_email: Optional[str] = os.getenv('TEST_USER_EMAIL')
test_password: Optional[str] = os.getenv('TEST_USER_PASSWORD')

if not pere:
    print("Erreur: Aucun citoyen parent n'a été trouvé dans la base de données.")
else:
    if not test_email or not test_password:
        raise ValueError(
            "Pour créer un compte de test, définis TEST_USER_EMAIL et TEST_USER_PASSWORD dans tes variables d'environnement."
        )
    # Crée ou récupère le compte
    user, created = CustomUser.objects.get_or_create(
        email=test_email,
        defaults={
            'username': 'citizen_test',
            'first_name': pere.prenom_fr,
            'last_name': pere.nom_fr,
            'cin': pere.cin,
            'phone': '98765432',
            'user_type': 'citizen',
            'is_verified': True
        }
    )
    
    if not created:
        user.cin = pere.cin
        user.first_name = pere.prenom_fr
        user.last_name = pere.nom_fr
    
    user.set_password(test_password)
    user.save()
    
    print("\n" + "="*50)
    print("✅ COMPTE CITOYEN CRÉÉ AVEC SUCCÈS ✅")
    print("="*50)
    print(f"Compte créé pour l'email de test défini dans TEST_USER_EMAIL.")
    print(f"CIN lié : {pere.cin}")
    print(f"Nom     : {pere.prenom_fr} {pere.nom_fr}")
    print("="*50)
    print("\nTu peux copier ces accès pour te connecter au front ou tester l'API.")
