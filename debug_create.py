import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser
from django.db import transaction

data = {
    "first_name": "Shell",
    "last_name": "Test",
    "cin": "11111111",
    "phone": "11111111",
    "email": "shell@example.com",
    "governorate": "Nabeul",
    "city": "Kelibia",
    "address": "Shell Address",
    "validation_method": "sms",
    "username": "shelluser11111111",
    "password": "Password123!"
}

try:
    with transaction.atomic():
        user = CustomUser.objects.create_user(**data)
        print(f"SUCCESS: User {user.username} created.")
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
