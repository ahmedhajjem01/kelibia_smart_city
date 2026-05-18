import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser

u = CustomUser.objects.filter(email='h9388096@gmail.com').first()
if u:
    print(f"User: {u.username}")
    print(f"City: {u.city}")
    print(f"Governorate: {u.governorate}")
    print(f"CIN Front UTF: {len(u.cin_front_utf) if u.cin_front_utf else 'None'}")
    print(f"CIN Back UTF: {len(u.cin_back_utf) if u.cin_back_utf else 'None'}")
else:
    print("User not found")
