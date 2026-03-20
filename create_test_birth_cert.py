import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from extrait_naissance.models import Citoyen, ExtraitNaissance
from django.utils import timezone

# Find Ahmed Hajjem
ahmed = Citoyen.objects.filter(prenom_fr="Ahmed", nom_fr="Hajjem").first()
if not ahmed:
    print("Ahmed not found")
else:
    # Create an ExtraitNaissance if it doesn't exist
    extrait, created = ExtraitNaissance.objects.get_or_create(
        titulaire=ahmed,
        defaults={
            'annee_acte': 1995,
            'numero_registre': '1234',
            'date_declaration': timezone.now(),
            'declarant_fr': 'Mohamed Hajjem (Père)',
            'declarant_ar': 'محمد هجوم (الأب)',
            'officer_etat_civil_fr': 'Officier Kelibia',
            'officer_etat_civil_ar': 'ضابط الحالة المدنية بقليبية',
            'arrondissement_gauche': 'K/Kelibia',
            'gouvernorat_fr': 'Nabeul',
            'gouvernorat_ar': 'نابل',
            'delegation_fr': 'Kelibia',
            'delegation_ar': 'قليبية',
            'commune_fr': 'Kelibia',
            'commune_ar': 'قليبية',
        }
    )
    if created:
        print(f"Created birth certificate for Ahmed. ID: {extrait.id}, UUID: {extrait.uuid}")
    else:
        print(f"Birth certificate already exists for Ahmed. ID: {extrait.id}, UUID: {extrait.uuid}")
