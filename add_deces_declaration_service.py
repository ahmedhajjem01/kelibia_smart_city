import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from services.models import Service, Category, Requirement

def add_deces_declaration():
    # 1. Get or Create Category
    cat_etat_civil, _ = Category.objects.get_or_create(
        name_fr="État Civil",
        defaults={'name_ar': "الحالة المدنية", 'icon': "fa-id-card"}
    )
    
    # 2. Create Service
    svc, created = Service.objects.get_or_create(
        name_fr="Déclaration de Décès",
        defaults={
            'category': cat_etat_civil,
            'name_ar': "تصريح بوفاة",
            'description_fr': "Déclarer le décès d'un membre de la famille auprès de la municipalité.",
            'description_ar': "التصريح بوفاة أحد أفراد العائلة لدى البلدية.",
            'processing_time': "1-2 jours ouvrables / 1-2 أيام عمل"
        }
    )
    
    if created:
        # 3. Add Requirements
        Requirement.objects.create(
            service=svc,
            name_fr="Certificat médical de décès",
            name_ar="شهادة طبية للوفاة"
        )
        Requirement.objects.create(
            service=svc,
            name_fr="Pièce d'identité du déclarant",
            name_ar="بطاقة تعريف المصرح"
        )
        print("Service 'Déclaration de Décès' ajouté avec succès.")
    else:
        print("Le service existe déjà.")

if __name__ == "__main__":
    add_deces_declaration()
