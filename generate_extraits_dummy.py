import os
import django
import random
from datetime import timedelta, date, datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from extrait_naissance.models import Citoyen, ExtraitNaissance

def generate_dummy_extraits():
    from extrait_mariage.models import ExtraitMariage
    from extrait_deces.models import ExtraitDeces
    from django.utils import timezone
    
    # Remove existing ones
    ExtraitMariage.objects.all().delete()
    ExtraitNaissance.objects.all().delete()
    ExtraitDeces.objects.all().delete()
    Citoyen.objects.all().delete()
    
    first_names_m = [("Mohamed", "محمد"), ("Ahmed", "أحمد"), ("Youssef", "يوسف"), ("Aziz", "عزيز"), ("Skander", "إسكندر"), ("Ilyes", "إلياس")]
    first_names_f = [("Fatma", "فاطمة"), ("Mariem", "مريم"), ("Nour", "نور"), ("Yasmine", "ياسمين"), ("Chaima", "شيماء"), ("Sirine", "سيرين")]
    last_names = [("Ben Ali", "بن علي"), ("Trabelsi", "الطرابلسي"), ("Gharbi", "الغربي"), ("Ayari", "العياري"), ("Riahi", "الرياحي")]
    
    num_families = 10
    for i in range(num_families):
        # 1. Parents
        pere_prenom_fr, pere_prenom_ar = random.choice(first_names_m)
        mere_prenom_fr, mere_prenom_ar = random.choice(first_names_f)
        nom_famille_fr, nom_famille_ar = random.choice(last_names)
        mere_nom_fr, mere_nom_ar = random.choice(last_names)
        
        pere = Citoyen.objects.create(
            n_etat_civil=f"EC-P-{random.randint(1000, 9999)}",
            cin=f"0{random.randint(1000000, 9999999)}",
            prenom_ar=pere_prenom_ar, prenom_fr=pere_prenom_fr,
            nom_ar=nom_famille_ar, nom_fr=nom_famille_fr,
            date_naissance=date(1980 + random.randint(0, 15), random.randint(1,12), random.randint(1,28)),
            lieu_naissance_ar="تونس", lieu_naissance_fr="Tunis",
            sexe='M',
            profession_ar="موظف", profession_fr="Employé",
            nationalite_ar="تونسية", nationalite_fr="Tunisienne"
        )
        
        mere = Citoyen.objects.create(
            n_etat_civil=f"EC-M-{random.randint(1000, 9999)}",
            cin=f"1{random.randint(1000000, 9999999)}",
            prenom_ar=mere_prenom_ar, prenom_fr=mere_prenom_fr,
            nom_ar=mere_nom_ar, nom_fr=mere_nom_fr,
            date_naissance=date(1982 + random.randint(0, 15), random.randint(1,12), random.randint(1,28)),
            lieu_naissance_ar="سوسة", lieu_naissance_fr="Sousse",
            sexe='F',
            profession_ar="طبيبة", profession_fr="Médecin",
            nationalite_ar="تونسية", nationalite_fr="Tunisienne"
        )
        
        # 2. Enfant
        sexe = random.choice(['M', 'F'])
        enfant_prenom_fr, enfant_prenom_ar = random.choice(first_names_m) if sexe == 'M' else random.choice(first_names_f)
        
        year = random.randint(2010, 2024)
        month = random.randint(1, 12)
        day = random.randint(1, 28)
        dob = date(year, month, day)
        
        enfant = Citoyen.objects.create(
            n_etat_civil=f"EC-{random.randint(1000, 9999)}",
            prenom_ar=enfant_prenom_ar, prenom_fr=enfant_prenom_fr,
            nom_ar=nom_famille_ar, nom_fr=nom_famille_fr,
            date_naissance=dob,
            date_naissance_lettres_ar=f"في اليوم {day} من شهر {month} سنة {year}",
            date_naissance_lettres_fr=f"Le {day} du mois {month} de l'année {year}",
            lieu_naissance_ar="قليبية", lieu_naissance_fr="Kelibia",
            sexe=sexe,
            pere=pere,
            mere=mere
        )
        
        # 3. Document
        ExtraitNaissance.objects.create(
            titulaire=enfant,
            annee_acte=year,
            numero_registre=str(random.randint(100, 999)),
            declaration=True,
            
            gouvernorat_ar="نابل", gouvernorat_fr="Nabeul",
            delegation_ar="قليبية", delegation_fr="Kelibia",
            commune_ar="قليبية", commune_fr="Kelibia",
            imada_ar="قليبية الشرقية", imada_fr="Kelibia Est",
            
            date_declaration=datetime(year, month, day, random.randint(8, 16), random.randint(0, 59)),
            declarant_ar="الأب", declarant_fr="Le père",
            officer_etat_civil_ar="ضابط الحالة المدنية", officer_etat_civil_fr="Officier Municipal",
            prix=1.000
        )
        
        # 4. Document pour le PERE
        ExtraitNaissance.objects.create(
            titulaire=pere,
            annee_acte=pere.date_naissance.year,
            numero_registre=str(random.randint(100, 999)),
            declaration=True,
            gouvernorat_ar="نابل", gouvernorat_fr="Nabeul",
            delegation_ar="قليبية", delegation_fr="Kelibia",
            commune_ar="قليبية", commune_fr="Kelibia",
            date_declaration=datetime(pere.date_naissance.year, pere.date_naissance.month, pere.date_naissance.day, 10, 0),
            declarant_ar="الأب", declarant_fr="Le père",
            officer_etat_civil_ar="ضابط الحالة المدنية", officer_etat_civil_fr="Officier Municipal",
            prix=1.000
        )

        # 5. Document pour la MERE
        ExtraitNaissance.objects.create(
            titulaire=mere,
            annee_acte=mere.date_naissance.year,
            numero_registre=str(random.randint(100, 999)),
            declaration=True,
            gouvernorat_ar="سوسة", gouvernorat_fr="Sousse",
            delegation_ar="سوسة", delegation_fr="Sousse",
            commune_ar="سوسة", commune_fr="Sousse",
            date_declaration=datetime(mere.date_naissance.year, mere.date_naissance.month, mere.date_naissance.day, 10, 0),
            declarant_ar="الأب", declarant_fr="Le père",
            officer_etat_civil_ar="ضابط الحالة المدنية", officer_etat_civil_fr="Officier Municipal",
            prix=1.000
        )
        
        # 6. Acte de mariage pour le PERE et la MERE
        ExtraitMariage.objects.create(
            epoux=pere,
            epouse=mere,
            annee_acte=year - random.randint(1, 10),
            numero_registre=str(random.randint(100, 999)),
            date_mariage=date(year - random.randint(1, 10), random.randint(1, 12), random.randint(1, 28)),
            date_mariage_lettres_ar="العاشر من ماي",
            date_mariage_lettres_fr="Dix Mai",
            lieu_mariage_ar=pere.lieu_naissance_ar,
            lieu_mariage_fr=pere.lieu_naissance_fr,
            regime_matrimonial='communaute' if random.choice([True, False]) else 'separation',
            officer_etat_civil_ar="محسن البحري",
            officer_etat_civil_fr="Mohsen Bahri",
            numero_ordre=str(random.randint(1000, 9000)),
            prix=2.000,
            observations_ar="",
            observations_fr=""
        )

        # 7. Acte de décès (Simulation pour les premières familles pour garantir le test)
        if i < 5:
            # On simule le décès d'un enfant pour garantir que les parents (test user) voient l'acte
            ExtraitDeces.objects.create(
                defunt=enfant,
                annee_acte=2024,
                numero_registre=str(100 + i),
                date_deces=timezone.now() - timedelta(days=random.randint(10, 50)),
                lieu_deces_ar="مستشفى قليبية",
                lieu_deces_fr="Hôpital de Kelibia",
                declarant_ar="قريب المتوفى",
                declarant_fr="Parent du défunt",
                officer_etat_civil_ar="محسن البحري",
                officer_etat_civil_fr="Mohsen Bahri",
                prix=0.500
            )
        
    print("10 familles et extraits relationnels ont été créés avec succès !")

if __name__ == '__main__':
    generate_dummy_extraits()
