import os
import django
import sys

# Ensure project root is in path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser
from extrait_mariage.models import ExtraitMariage
from extrait_deces.models import ExtraitDeces
from django.db.models import Q

def debug_user_extracts(email):
    print(f"--- Debugging Extracts for user: {email} ---")
    try:
        user = CustomUser.objects.get(email=email)
        print(f"User CIN: {user.cin}")
        
        # Simulate ExtraitMariage query
        try:
            # Re-import inside just to be safe if there was a scope issue, though unlikely
            from extrait_mariage.models import ExtraitMariage as EMModel
            mariages = EMModel.objects.filter(
                Q(user=user) | 
                Q(epoux__cin=user.cin) | 
                Q(epouse__cin=user.cin)
            ).distinct()
            print(f"ExtraitMariage count: {mariages.count()}")
            for m in mariages:
                conjoint_name = m.epouse.nom_fr if m.epoux.cin == user.cin else m.epoux.nom_fr
                print(f" - Marriage with {conjoint_name}")
        except Exception as e:
            print(f"ERROR ExtraitMariage: {e}")

        # Simulate MesDeces query
        try:
            from extrait_naissance.models import Citoyen
            citoyen = Citoyen.objects.get(cin=user.cin)
            
            # Collect family members
            mariages_list = EMModel.objects.filter(
                Q(epoux=citoyen) | Q(epouse=citoyen)
            )
            conjoints = [m.epouse if m.epoux == citoyen else m.epoux for m in mariages_list]
            
            family_ids = []
            if citoyen.pere: family_ids.append(citoyen.pere.id)
            if citoyen.mere: family_ids.append(citoyen.mere.id)
            for c in conjoints: family_ids.append(c.id)
            
            if citoyen.pere:
                if citoyen.pere.pere: family_ids.append(citoyen.pere.pere.id)
                if citoyen.pere.mere: family_ids.append(citoyen.pere.mere.id)
            if citoyen.mere:
                if citoyen.mere.pere: family_ids.append(citoyen.mere.pere.id)
                if citoyen.mere.mere: family_ids.append(citoyen.mere.mere.id)

            deces_qs = ExtraitDeces.objects.filter(
                Q(defunt_id__in=family_ids) |
                Q(defunt__pere=citoyen) |
                Q(defunt__mere=citoyen)
            ).distinct()
            print(f"ExtraitDeces count: {deces_qs.count()}")
            for d in deces_qs:
                print(f" - Death of {d.defunt.prenom_fr} {d.defunt.nom_fr}")
        except Citoyen.DoesNotExist:
            print(f"INFO: Citoyen not found for user CIN (normal for new users)")
        except Exception as e:
            print(f"ERROR ExtraitDeces: {e}")

    except CustomUser.DoesNotExist:
        print(f"ERROR: User {email} not found")
    except Exception as e:
        print(f"GLOBAL ERROR: {e}")

if __name__ == "__main__":
    emails = ["testuser@example.com", "citizen@kelibia.tn"]
    for email in emails:
        debug_user_extracts(email)
        print("-" * 30)
