import os, django
from django.utils import timezone
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from extrait_naissance.models import HospitalBirthRecord

def seed_hospital_data():
    # Ahmed Hajjem's kids mock data
    # Ahmed CIN is 01234567, but let's assume the mother's CIN is linked
    # Let's say we have a new birth for Ahmed's wife
    
    HospitalBirthRecord.objects.get_or_create(
        cert_number="HOSP-2026-999",
        defaults={
            'hospital_name': "Hôpital de Circonscription de Kélibia",
            'date_naissance': timezone.now(),
            'sexe': 'M',
            'cin_mere': "11223344", # Mock Mother CIN
            'cin_pere': "01234567", # Ahmed Hajjem
        }
    )
    print("Mock hospital record created: HOSP-2026-999")

if __name__ == "__main__":
    seed_hospital_data()
