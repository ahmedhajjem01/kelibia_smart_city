import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser

services = [
    ('trash',            'agent_dechet'),
    ('roads',            'agent_route'),
    ('noise',            'agent_bruit'),
    ('water',            'agent_eau'),
    ('social',           'agent_social'),
    ('commerce',         'agent_commerce'),
    ('taxes',            'agent_impots'),
    ('residence',        'agent_residence'),
    ('news_editor',      'agent_actualites'),
    ('general',          'agent_general'),
]

for service_key, username in services:
    email = f"{username}@kelibia.tn"
    password = "Password123!"
    cin = f"5{services.index((service_key, username)):07d}" # Generate unique CIN
    phone = f"555500{services.index((service_key, username)):02d}" # Generate unique phone
    
    try:
        if not CustomUser.objects.filter(username=username).exists():
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                assigned_service=service_key,
                user_type='agent',
                cin=cin,
                phone=phone,
                is_staff=True,
                is_verified=True,
                is_active=True
            )
            print(f"Created {username}")
        else:
            print(f"{username} already exists")
    except Exception as e:
        print(f"Failed to create {username}: {e}")
