import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from services.models import Category, Service, Requirement

def seed_services():
    # 1. State Civil (État Civil)
    etat_civil, _ = Category.objects.get_or_create(
        name_fr="État Civil",
        name_ar="الحالة المدنية",
        icon="fa-id-card"
    )

    marriage, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Contrat de Mariage",
        name_ar="عقد زواج",
        description_fr="Documents nécessaires pour la conclusion d'un acte de mariage.",
        description_ar="الأوراق المطلوبة لإبرام عقد الزواج.",
        processing_time="Immédiat"
    )

    marriage_reqs = [
        ("Extrait de naissance de chacun des deux conjoints", "مضمون ولادة لكل من الزوجين"),
        ("Certificat médical prénuptial", "شهادة طبية سابقة للزواج"),
        ("Copie de la CIN des deux conjoints", "نسخة من بطاقة التعريف الوطنية للزوجين"),
        ("Copie de la CIN des deux témoins", "نسخة من بطاقة التعريف الوطنية للشاهدين")
    ]
    for fr, ar in marriage_reqs:
        Requirement.objects.get_or_create(service=marriage, name_fr=fr, name_ar=ar)

    birth, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Extrait de Naissance",
        name_ar="مضمون ولادة",
        description_fr="Obtention d'un extrait de naissance.",
        description_ar="الحصول على مضمون ولادة.",
        processing_time="10 minutes"
    )
    Requirement.objects.get_or_create(service=birth, name_fr="CIN du demandeur", name_ar="بطاقة التعريف الوطنية لمقدم الطلب")

    # 2. Urbanisme & Travaux (التعمير والأشغال)
    urbanisme, _ = Category.objects.get_or_create(
        name_fr="Urbanisme & Travaux",
        name_ar="التعمير والأشغال",
        icon="fa-building"
    )

    permis_batir, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Permis de Bâtir",
        name_ar="رخصة بناء",
        description_fr="Demande d'autorisation pour construire un bâtiment.",
        description_ar="طلب رخصة لبناء عقار.",
        processing_time="15 à 45 jours"
    )
    urbanisme_reqs = [
        ("Demande sur papier timbre", "مطلب على ورق تمبر"),
        ("Certificat de propriété", "شهادة ملكية"),
        ("Projet d'architecture", "مشروع معماري"),
        ("Quittance de paiement des taxes", "وصل خلاص الأداءات البلدية")
    ]
    for fr, ar in urbanisme_reqs:
        Requirement.objects.get_or_create(service=permis_batir, name_fr=fr, name_ar=ar)

    # New Demands from Images
    terrasement, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Tarbied / Tabeed de Route",
        name_ar="تعبيد طريق",
        description_fr="Demande de pavage ou de goudronnage d'une route.",
        description_ar="حول طلب تعبيد طريق.",
        processing_time="Selon planning"
    )
    Requirement.objects.get_or_create(service=terrasement, name_fr="Demande écrite", name_ar="مطلب كتابي")

    renovation_permis, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Permis de Restauration / Rénovation",
        name_ar="رخصة ترميم بناية",
        description_fr="Autorisation pour effectuer des travaux de restauration sur un bâtiment existant.",
        description_ar="حول طلب رخصة ترميم بناية.",
        processing_time="15 jours"
    )

    occupation_public, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Occupation Temporaire du Domaine Public",
        name_ar="إشغال الطريق العام (أشغال بناء/ترميم)",
        description_fr="Autorisation d'occuper la voie publique pour des travaux.",
        description_ar="طلب رخصة في إشغال الطريق العام بمناسبة إقامة أشغال بناء أو ترميم محل.",
        processing_time="7 jours"
    )

    # 3. Fiscalité & Finance (الخدمات الجبائية)
    fiscalite, _ = Category.objects.get_or_create(
        name_fr="Fiscalité & Finance",
        name_ar="الخدمات الجبائية",
        icon="fa-file-invoice-dollar"
    )

    services_جبائية, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Services Fiscaux",
        name_ar="طلب خدمات جبائية",
        description_fr="Enregistrement foncier, changement de propriété, arrêt d'activité.",
        description_ar="ترسيم عقار، ترسيم مناب، تغيير ملكية عقار، تغيير صبغة عقار، إعلام بإيقاف نشاط.",
        processing_time="Variable"
    )

    tnd_immobilier, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Attestation de Recouvrement des Taxes",
        name_ar="شهادة في ترسيم عقار بجدول التحصيل",
        description_fr="Attestation pour les propriétés bâties ou non bâties.",
        description_ar="طلب شهادة في ترسيم عقار بجدول تحصيل المعاليم الموظفة على العقارات (المبنية / غير المبنية).",
        processing_time="2 jours"
    )

    # 4. Autorisations Commerciales & Divers (رخص تجارية متنوعة)
    commerce, _ = Category.objects.get_or_create(
        name_fr="Commerce & Autorisations",
        name_ar="التجارة والرخص",
        icon="fa-store"
    )

    cahier_charges, _ = Service.objects.get_or_create(
        category=commerce,
        name_fr="Cahier des Charges (Locaux/Cafés/Jeux)",
        name_ar="كراس الشروط (محلات/مقاهي/ألعاب)",
        description_fr="Respect des conditions de salubrité et d'exploitation.",
        description_ar="كراس الشروط الخاص بضبط الشروط العامة لصلوحية المحلات أو استغلال المقاهي.",
        processing_time="Immédiat"
    )

    enseigne_pub, _ = Service.objects.get_or_create(
        category=commerce,
        name_fr="Permis d'Enseigne Publicitaire",
        name_ar="رخصة علامة إشهارية",
        description_fr="Autorisation pour l'installation d'une plaque ou enseigne publicitaire.",
        description_ar="حول طلب رخصة في تركيز علامة إشهارية.",
        processing_time="10 jours"
    )

    # 5. Réseaux & Services Publics (الربط بالشبكات)
    reseaux, _ = Category.objects.get_or_create(
        name_fr="Réseaux & Connexions",
        name_ar="الربط بالشبكات",
        icon="fa-plug"
    )

    connexion_reseau, _ = Service.objects.get_or_create(
        category=reseaux,
        name_fr="Raccordement aux Réseaux",
        name_ar="ترخيص الربط بالشبكات البلدية",
        description_fr="Autorisation pour le raccordement Eau, Électricité, Assainissement.",
        description_ar="حول طلب ترخيص الربط بالشبكات البلدية (ماء، كهرباء، تطهير).",
        processing_time="15 jours"
    )

    # 6. Réclamations (الشكاوى)
    reclamations, _ = Category.objects.get_or_create(
        name_fr="Réclamations",
        name_ar="الشكاوى والبلاغات",
        icon="fa-exclamation-triangle"
    )

    bruit, _ = Service.objects.get_or_create(
        category=reclamations,
        name_fr="Plainte pour Nuisance Sonore",
        name_ar="شكوى حول الضجيج",
        description_fr="Signalement de bruit excessif ou nuisance nocturne.",
        description_ar="حول شكوى حول الضجيج.",
        processing_time="Traitement police municipale"
    )

    print("Database expanded successfully with real Kelibia Municipality demands!")

if __name__ == "__main__":
    seed_services()
