import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser

agents = [
    {
        'username': 'agent_forum',
        'email': 'agent_forum@kelibia.tn',
        'password': 'Password123!',
        'assigned_service': 'forum_moderator',
        'cin': '11111111',
        'phone': '22222221'
    },
    {
        'username': 'agent_civil',
        'email': 'agent_civil@kelibia.tn',
        'password': 'Password123!',
        'assigned_service': 'civil_registry',
        'cin': '22222222',
        'phone': '22222222'
    },
    {
        'username': 'agent_construction',
        'email': 'agent_construction@kelibia.tn',
        'password': 'Password123!',
        'assigned_service': 'construction',
        'cin': '33333333',
        'phone': '22222223'
    },
    {
        'username': 'agent_lumiere',
        'email': 'agent_lumiere@kelibia.tn',
        'password': 'Password123!',
        'assigned_service': 'lighting',
        'cin': '44444444',
        'phone': '22222224'
    }
]

for a in agents:
    try:
        if not CustomUser.objects.filter(username=a['username']).exists():
            user = CustomUser.objects.create_user(
                username=a['username'],
                email=a['email'],
                password=a['password'],
                assigned_service=a['assigned_service'],
                user_type='agent',
                cin=a['cin'],
                phone=a['phone'],
                is_staff=True,
                is_verified=True,
                is_active=True
            )
            print(f"Created {a['username']}")
        else:
            print(f"{a['username']} already exists")
    except Exception as e:
        print(f"Failed to create {a['username']}: {e}")
