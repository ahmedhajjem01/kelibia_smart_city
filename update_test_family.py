import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from extrait_naissance.models import ExtraitNaissance

count = 0
for ext in ExtraitNaissance.objects.filter(prix=0.5):
    ext.prix = 1.0
    ext.save()
    count += 1

print(f"{count} extraits d'enfants mis à jour à 1.000 DT !")
