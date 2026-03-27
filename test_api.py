import os
import sys

# 1. Set environment variables FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# 2. Add project root to path
sys.path.append(os.getcwd())

# 3. Setup Django BEFORE importing any models/apps
import django
django.setup()

# 4. Now imports are safe
from accounts.models import CustomUser
from rest_framework.test import APIClient

def test_api_calls(email):
    print(f"--- Testing APIs for user: {email} ---")
    try:
        user = CustomUser.objects.get(email=email)
        print(f"Found user: {user.email}, CIN: {user.cin}")
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        # Test Marriage
        print("Testing GET /extrait-mariage/extraits/ ...")
        res_mariage = client.get('/extrait-mariage/extraits/')
        print(f"Status: {res_mariage.status_code}")
        if res_mariage.status_code == 200:
            print(f"Data count: {len(res_mariage.data)}")
            if len(res_mariage.data) > 0:
                print(f"First item keys: {res_mariage.data[0].keys()}")
        else:
            print(f"Error data: {res_mariage.data}")

        # Test Deces
        print("Testing GET /extrait-deces/api/mes-deces/ ...")
        res_deces = client.get('/extrait-deces/api/mes-deces/')
        print(f"Status: {res_deces.status_code}")
        if res_deces.status_code == 200:
            print(f"Data count: {len(res_deces.data.get('deces', []))}")
        else:
            print(f"Error data: {res_deces.data}")

        # Test Naissance
        print("Testing GET /extrait-naissance/api/mes-extraits/ ...")
        res_naiss = client.get('/extrait-naissance/api/mes-extraits/')
        print(f"Status: {res_naiss.status_code}")
        if res_naiss.status_code == 200:
            print(f"Data keys: {res_naiss.data.keys()}")
        else:
            print(f"Error data: {res_naiss.data}")

    except CustomUser.DoesNotExist:
        print(f"ERROR: User {email} not found in database.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"GLOBAL ERROR: {e}")

if __name__ == "__main__":
    # Test for the known user
    test_api_calls("citizen@kelibia.tn")
