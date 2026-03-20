import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from extrait_naissance.models import Citoyen
from extrait_mariage.models import ExtraitMariage

def diag():
    print("--- EM ID 1 ---")
    em = ExtraitMariage.objects.get(id=1)
    print(f"ID: {em.id}")
    print(f"Num: {em.numero_registre}")
    print(f"Year: {em.annee_acte}")
    print(f"Epoux: {em.epoux.prenom_fr} {em.epoux.nom_fr} (ID: {em.epoux.id}, CIN: {em.epoux.cin})")
    print(f"Epouse: {em.epouse.prenom_fr} {em.epouse.nom_fr} (ID: {em.epouse.id}, CIN: {em.epouse.cin})")
    
    print("\n--- Citizens with these names ---")
    mohameds = Citoyen.objects.filter(prenom_fr='Mohamed', nom_fr='Hammami')
    print(f"Mohamed Hammami count: {mohameds.count()}")
    for m in mohameds:
        print(f"  ID: {m.id}, CIN: {m.cin}")
        
    ahmeds = Citoyen.objects.filter(prenom_fr='Ahmed', nom_fr='Hajjem')
    print(f"Ahmed Hajjem count: {ahmeds.count()}")
    for a in ahmeds:
        print(f"  ID: {a.id}, CIN: {a.cin}")

if __name__ == "__main__":
    diag()
