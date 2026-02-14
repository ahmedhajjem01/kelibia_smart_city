import requests
import json

url = "http://127.0.0.1:8000/api/users/"
data = {
    "first_name": "Test",
    "last_name": "User",
    "cin": "99999999",
    "phone": "99999999",
    "email": "test@example.com",
    "governorate": "Nabeul",
    "city": "Kelibia",
    "address": "Test Address",
    "validation_method": "sms",
    "username": "testuser99999999",
    "password": "Password123!",
    "re_password": "Password123!"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response Content:")
    print(json.dumps(response.json(), indent=4, ensure_ascii=False))
except Exception as e:
    print(f"Connection Error: {e}")
