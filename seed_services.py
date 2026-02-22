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
        description_fr="C'est le document officiel pour vous marier légalement. Il regroupe toutes les infos sur vous et votre futur conjoint.",
        description_ar="هذه هي الوثيقة الرسمية للزواج قانونياً. تضم كل المعلومات عنك وعن شريك حياتك القادم.",
        processing_time="Immédiat"
    )

    marriage_reqs = [
        ("Grand extrait de naissance (moins de 3 mois)", "مضمون ولادة جديد (أقل من 3 أشهر)"),
        ("Certificat médical (examen pour mariage)", "شهادة طبية (فحص الزواج)"),
        ("Copie simple de votre carte d'identité (CIN)", "نسخة عادية من بطاقة التعريف"),
        ("Copie de la carte d'identité des deux témoins", "نسخة من بطاقة التعريف للشاهدين")
    ]
    for fr, ar in marriage_reqs:
        Requirement.objects.get_or_create(service=marriage, name_fr=fr, name_ar=ar)

    birth, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Extrait de Naissance",
        name_ar="مضمون ولادة",
        description_fr="Une preuve officielle de votre naissance. Utile pour presque toutes les démarches administratives.",
        description_ar="وثيقة رسمية تثبت ولادتك. ستحتاجها في أغلب الأوراق الرسمية.",
        processing_time="10 minutes"
    )
    Requirement.objects.get_or_create(service=birth, name_fr="Votre carte d'identité (CIN)", name_ar="بطاقة التعريف الوطنية الخاصة بك")

    # 2. Urbanisme & Travaux (التعمير والأشغال)
    urbanisme, _ = Category.objects.get_or_create(
        name_fr="Maison & Construction",
        name_ar="المنزل والبناء",
        icon="fa-house-chimney"
    )

    permis_batir, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Autorisation de construire",
        name_ar="رخصة بناء",
        description_fr="Vous devez demander ceci avant de poser la première brique de votre nouvelle maison ou d'ajouter un étage.",
        description_ar="يجب أن تطلب هذه الرخصة قبل البدء في بناء منزلك الجديد أو إضافة طابق إضافي.",
        processing_time="15 à 45 jours"
    )
    urbanisme_reqs = [
        ("Un simple papier avec un timbre fiscal", "مطلب بسيط عليه تمبر جبائي"),
        ("Preuve que vous êtes le propriétaire du terrain", "شهادة تثبت أنك صاحب الأرض"),
        ("Les plans dessinés par l'architecte", "الأمثلة التي رسمها المهندس المعماري"),
        ("Un reçu qui prouve que vous avez payé vos taxes locales", "وصل يثبت أنك دفعت الأداءات البلدية")
    ]
    for fr, ar in urbanisme_reqs:
        Requirement.objects.get_or_create(service=permis_batir, name_fr=fr, name_ar=ar)

    # New Demands from Images
    terrasement, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Demande de Goudronnage de la Rue",
        name_ar="طلب تعبيد طريق",
        description_fr="Pour demander à la mairie de goudronner ou de réparer la route devant chez vous.",
        description_ar="لطلب تعبيد أو إصلاح الطريق الموجود أمام منزلك من البلدية.",
        processing_time="Dépends du planning de la mairie"
    )
    Requirement.objects.get_or_create(service=terrasement, name_fr="Une simple lettre explicative", name_ar="مورقة توضيحية بسيطة")

    renovation_permis, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Réparations de la Maison (Rénovation)",
        name_ar="رخصة ترميم بناية",
        description_fr="Indispensable pour faire des gros travaux de réparation ou ravalement de façade sans changer la structure.",
        description_ar="ضروري للقيام بإصلاحات كبرى أو دهن الواجهة دون تغيير هيكل البناء.",
        processing_time="15 jours"
    )

    occupation_public, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Utiliser le trottoir pour vos travaux",
        name_ar="إشغال الطريق العام",
        description_fr="Si vous avez besoin de poser du sable ou des briques sur le trottoir pendant que vous construisez.",
        description_ar="إذا كنت بحاجة لوضع الرمل أو الياجور على الرصيف أثناء قيامك بأشغال البناء.",
        processing_time="7 jours"
    )

    # 3. Fiscalité & Finance (المالية والضرائب)
    fiscalite, _ = Category.objects.get_or_create(
        name_fr="Argent & Impôts",
        name_ar="الأموال والأداءات",
        icon="fa-wallet"
    )

    services_جبائية, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Choses liées au terrain et impôts",
        name_ar="خدمات جبائية",
        description_fr="Pour enregistrer un terrain, changer le nom du propriétaire ou arrêter un commerce.",
        description_ar="لتسجيل أرض، تغيير اسم المالك أو إغلاق محل تجاري.",
        processing_time="Dépend de votre dossier"
    )

    tnd_immobilier, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Preuve de paiement des impôts sur la maison",
        name_ar="شهادة خلاص الأداءات",
        description_fr="Une attestation qui confirme que vous n'avez plus de dettes fiscales envers la mairie pour votre maison.",
        description_ar="شهادة تؤكد أنك قمت بخلاص كل الأداءات البلدية المطلوبة لمنزلك.",
        processing_time="2 jours"
    )

    # 4. Autorisations Commerciales (المشاريع والمحلات)
    commerce, _ = Category.objects.get_or_create(
        name_fr="Boutiques & Commerces",
        name_ar="المحلات والمشاريع",
        icon="fa-shop"
    )

    cahier_charges, _ = Service.objects.get_or_create(
        category=commerce,
        name_fr="Règles pour ouvrir un Café ou une Boutique",
        name_ar="كراس الشروط",
        description_fr="C'est le guide des règles que vous devez signer pour avoir le droit d'ouvrir votre commerce.",
        description_ar="هو دليل القواعد الذي يجب أن تمضيه لتتمكن من فتح مشروعك الخاص.",
        processing_time="Tout de suite"
    )

    enseigne_pub, _ = Service.objects.get_or_create(
        category=commerce,
        name_fr="Installer une enseigne ou un panneau",
        name_ar="رخصة علامة إشهارية",
        description_fr="Avant de mettre un grand panneau publicitaire sur votre boutique, vous devez prévenir la mairie.",
        description_ar="قبل وضع لافتة كبيرة أو إشهار فوق محلك، يجب عليك إعلام البلدية والحصول على موافقة.",
        processing_time="10 jours"
    )

    # 5. Réseaux & Services Publics (الربط بالخدمات)
    reseaux, _ = Category.objects.get_or_create(
        name_fr="Eau, Lumière et Égouts",
        name_ar="الماء والكهرباء والتطهير",
        icon="fa-bolt"
    )

    connexion_reseau, _ = Service.objects.get_or_create(
        category=reseaux,
        name_fr="Brancher ma maison à l'eau ou l'électricité",
        name_ar="الربط بالشبكات",
        description_fr="Vous avez besoin de ce papier de la mairie pour que la SONEDE ou la STEG viennent brancher votre maison.",
        description_ar="تحتاج لهذه الورقة من البلدية ليتمكن عمال الصوناد أو الستاغ من ربط منزلك بالماء أو الكهرباء.",
        processing_time="15 jours"
    )

    # 6. Réclamations (الشكاوى والمشاكل)
    reclamations, _ = Category.objects.get_or_create(
        name_fr="Problèmes & Signalements",
        name_ar="المشاكل والشكاوى",
        icon="fa-bullhorn"
    )

    bruit, _ = Service.objects.get_or_create(
        category=reclamations,
        name_fr="Se plaindre du bruit (Voisins ou Travaux)",
        name_ar="شكوى من الضجيج",
        description_fr="Pour signaler que quelqu'un fait trop de bruit le soir ou sans autorisation.",
        description_ar="للإبلاغ عن وجود ضجيج مزعج في الليل أو أعمال بناء بدون رخصة تزعج المارة.",
        processing_time="Transmis à la police municipale"
    )

    print("Base de données mise à jour avec des descriptions simples et claires !")

if __name__ == "__main__":
    seed_services()
