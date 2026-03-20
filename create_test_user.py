import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from extrait_naissance.models import Citoyen

CustomUser = get_user_model()

# Trouve un citoyen (Père) qui a des enfants enregistrés
pere = Citoyen.objects.filter(enfants_pere__isnull=False).first()

if not pere:
    print("Erreur: Aucun citoyen parent n'a été trouvé dans la base de données.")
else:
    # Crée ou récupère le compte
    user, created = CustomUser.objects.get_or_create(
        email='citizen@kelibia.tn',
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
    
    user.set_password('Kelibia2026!')
    user.save()
    
    print("\n" + "="*50)
    print("✅ COMPTE CITOYEN CRÉÉ AVEC SUCCÈS ✅")
    print("="*50)
    print(f"Email   : citizen@kelibia.tn")
    print(f"Mot de passe  : Kelibia2026!")
    print(f"CIN lié : {pere.cin}")
    print(f"Nom     : {pere.prenom_fr} {pere.nom_fr}")
    print("="*50)
    print("\nTu peux copier ces accès pour te connecter au front ou tester l'API.")
