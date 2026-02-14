import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

User = get_user_model()
username = 'admin'
email = 'admin@kelibiasmartcity.tn'
password = 'admin'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(
        username=username, 
        email=email, 
        password=password,
        cin='00000000',
        phone='00000000',
        address='Mairie',
        governorate='Nabeul',
        city='Kelibia'
    )
    print(f"Superuser '{username}' created successfully.")
else:
    print(f"Superuser '{username}' already exists.")
