import os
import django
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser

def demote_to_agent_strict(email):
    try:
        user = CustomUser.objects.get(email=email)
        user.is_staff = False
        user.is_superuser = False
        user.user_type = 'agent'
        user.save()
        print(f"Successfully demoted {email} to Agent (removed Superuser AND Staff rights).")
    except CustomUser.DoesNotExist:
        # Let's list all users to see if there's a typo
        all_emails = [u.email for u in CustomUser.objects.all()]
        print(f"Error: User with email {email} does not exist.")
        print(f"Available users: {all_emails}")

if __name__ == "__main__":
    demote_to_agent_strict('agent1@kelibiasmartcity.tn')
