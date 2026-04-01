import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kelibia_smart_city.settings')
django.setup()

from accounts.models import CustomUser

def promote_to_supervisor(email):
    try:
        user = CustomUser.objects.get(email=email)
        user.is_staff = True
        user.is_superuser = True
        user.user_type = 'supervisor'
        user.save()
        print(f"Successfully promoted {email} to Supervisor/Superuser.")
    except CustomUser.DoesNotExist:
        print(f"Error: User with email {email} does not exist.")

if __name__ == "__main__":
    promote_to_supervisor('agent1@kelibiasmartcity.tn')
