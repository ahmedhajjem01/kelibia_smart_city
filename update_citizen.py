import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser

u = CustomUser.objects.filter(user_type='citizen', is_verified=False).first()
if u:
    u.city = 'Kélibia'
    u.governorate = 'Nabeul'
    # Dummy red dot image
    dummy_img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
    u.cin_front_utf = dummy_img
    u.cin_back_utf = dummy_img
    u.save()
    print(f"Updated citizen: {u.username}")
else:
    print("No unverified citizen found")
