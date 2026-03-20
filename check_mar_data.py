import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from extrait_naissance.models import Citoyen
from extrait_mariage.models import ExtraitMariage

def check_data():
    print("Checking Citizens...")
    ahmed = Citoyen.objects.filter(cin='01869376').first()
    if ahmed:
        print(f"Ahmed found: {ahmed.prenom_fr} {ahmed.nom_fr} (ID: {ahmed.id})")
    else:
        print("Ahmed not found by CIN")

    sara = Citoyen.objects.filter(prenom_fr='Sara', nom_fr='Gharbi').first()
    if sara:
        print(f"Sara found: {sara.prenom_fr} {sara.nom_fr} (ID: {sara.id})")
    else:
        print("Sara not found by name")

    em = ExtraitMariage.objects.get(id=1)
    print(f"Marriage ID 1 current Epoux: {em.epoux.prenom_fr} {em.epoux.nom_fr} (ID: {em.epoux.id})")
    print(f"Marriage ID 1 current Epouse: {em.epouse.prenom_fr} {em.epouse.nom_fr} (ID: {em.epouse.id})")

if __name__ == "__main__":
    check_data()
