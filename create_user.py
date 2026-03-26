import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser

def create_target_user():
    email = "citizen@kelibia.tn"
    first_name = "Ahmed"
    last_name = "Hajjem"
    username = "ahmedhajjem"
    
    if not CustomUser.objects.filter(email=email).exists():
        user = CustomUser.objects.create_user(
            email=email,
            username=username,
            password="TemporaryPassword123!", # User should change this
            first_name=first_name,
            last_name=last_name,
            is_verified=True, # Verify him as requested
            user_type='citizen'
        )
        print(f"User {email} created successfully.")
    else:
        print(f"User {email} already exists.")

if __name__ == "__main__":
    create_target_user()
