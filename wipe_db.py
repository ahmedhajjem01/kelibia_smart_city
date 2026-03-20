import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.db import connection
cursor = connection.cursor()
try:
    cursor.execute("DROP TABLE IF EXISTS extrait_naissance_extraitnaissance CASCADE;")
    cursor.execute("DROP TABLE IF EXISTS extrait_naissance_citoyen CASCADE;")
    cursor.execute("DELETE FROM django_migrations WHERE app='extrait_naissance';")
    print("Database wiped successfully.")
except Exception as e:
    print(f"Error: {e}")
