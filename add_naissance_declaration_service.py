import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from services.models import Service, Category, Requirement

def add_naissance_declaration():
    # 1. Get Category
    cat_etat_civil = Category.objects.get(name_fr="État Civil")
    
    # 2. Create Service
    svc, created = Service.objects.get_or_create(
        name_fr="Déclaration de Naissance",
        defaults={
            'category': cat_etat_civil,
            'name_ar': "تصريح بولادة",
            'description_fr': "Déclarer la naissance d'un nouveau-né auprès de la municipalité.",
            'description_ar': "التصريح بولادة مولود جديد لدى البلدية.",
            'processing_time': "1-2 jours ouvrables / 1-2 أيام عمل"
        }
    )
    
    if created:
        # 3. Add Requirements
        Requirement.objects.create(
            service=svc,
            name_fr="Certificat d'accouchement",
            name_ar="شهادة وضع"
        )
        Requirement.objects.create(
            service=svc,
            name_fr="Livret de famille ou CIN des parents",
            name_ar="دفتر العائلة أو بطاقة تعريف الأبوين"
        )
        print("Service 'Déclaration de Naissance' ajouté avec succès.")
    else:
        print("Le service existe déjà.")

if __name__ == "__main__":
    add_naissance_declaration()
