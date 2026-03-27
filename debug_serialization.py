import os
import django
import sys

# Ensure project root is in path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser
from extrait_mariage.models import ExtraitMariage
from extrait_mariage.serializers import ExtraitMariageSerializer
from django.db.models import Q

def debug_serialization(email):
    print(f"--- Debugging Serialization for user: {email} ---")
    try:
        user = CustomUser.objects.get(email=email)
        print(f"User CIN: {user.cin}")
        
        # Simulate local query
        mariages = ExtraitMariage.objects.filter(
            Q(user=user) | 
            Q(epoux__cin=user.cin) | 
            Q(epouse__cin=user.cin)
        ).distinct()
        
        print(f"Found {mariages.count()} mariages.")
        
        # Attempt serialization
        for m in mariages:
            try:
                print(f"Serializing mariage ID {m.id}...")
                serializer = ExtraitMariageSerializer(m)
                data = serializer.data
                print(f"Successfully serialized: {data.get('numero_registre')} / {data.get('annee_acte')}")
            except Exception as e:
                print(f"ERROR serializing mariage ID {m.id}: {e}")

    except Exception as e:
        print(f"GLOBAL ERROR: {e}")

if __name__ == "__main__":
    debug_serialization("citizen@kelibia.tn")
