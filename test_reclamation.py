import requests

url = "http://localhost:8000/api/reclamations/"
# I need a token. I'll take it from the user's session if possible or just create a user.
# But wait, I can just try to see if it even reaches the endpoint or returns a 500.

payload = {
    "title": "Test Title",
    "description": "Test Description",
    "category": "other",
    "latitude": "",
    "longitude": ""
}

try:
    res = requests.post(url, data=payload)
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
