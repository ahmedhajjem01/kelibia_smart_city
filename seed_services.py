import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from services.models import Category, Service, Requirement

def seed_services():
    # We no longer delete all to preserve manual edits (like PDF paths)
    # Category.objects.all().delete()
    # Service.objects.all().delete()
    # Requirement.objects.all().delete()

    # 1. State Civil (État Civil)
    etat_civil, _ = Category.objects.get_or_create(
        name_fr="État Civil",
        name_ar="الحالة المدنية",
        icon="fa-id-card"
    )

    marriage, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Contrat de Mariage",
        name_ar="إبرام عقد زواج",
        description_fr="C'est le document officiel pour vous marier légalement. Conditions : Capacité légale, âge minimum, consentement, pas d' empêchements et fixation du dot.",
        description_ar="الوثيقة الرسمية للزواج. الشروط: توفر الشروط القانونية، السن القانوني، رضا الزوجين، خلوهما من الموانع الشرعية، وتسمية المهر.",
        processing_time="2 jours à 1 semaine (من يومين إلى أسبوع)"
    )

    marriage_reqs = [
        ("Grand extrait de naissance pour chacun des époux", "مضمون ولادة لكل من الزوجين"),
        ("Certificat médical d'aptitude au mariage", "الشهادة الطبية لإتمام الزواج"),
        ("Copie de la CIN (ou document d'identité officiel)", "نسخة من بطاقة التعريف أو أي وثيقة رسمية تثبت هوية الزوجين"),
        ("Autorisation judiciaire pour les mineurs", "إذن من المحكمة لمن هم دون السن القانوني"),
        ("Accord écrit du tuteur (si absence ou mineur)", "موافقة كتابية للولي بحجة عادلة (في صورة التغيب أو القصر)"),
        ("Extrait de décès du conjoint (pour les veufs)", "مضمون وفاة الزوج أو الزوجة بالنسبة للأرامل"),
        ("Jugement de divorce ou extrait avec mention divorce", "نسخة من حكم الطلاق أو مضمون ولادة به تنصيص على الطلاق"),
        ("Autorisation administrative (militaires, douanes, police...)", "ترخيص من الإدارة (للأعوان الخاضعين لترخيص مسبق)"),
        ("Certificat de capacité matrimoniale (pour les étrangers)", "بينة من القنصلية تشهد بإمكانية الزواج (للأجانب)"),
        ("Certificat de conversion à l'Islam (pour non-musulmans avec Tunisienne)", "شهادة اعتناق الإسلام (لغير المسلمين الراغبين في التزوج بتونسية)"),
        ("Présentation de la CIN pour les deux témoins", "الاستظهار ببطاقة التعريف بالنسبة للشاهدين")
    ]
    for fr, ar in marriage_reqs:
        Requirement.objects.get_or_create(service=marriage, name_fr=fr, name_ar=ar)

    birth, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Extrait de Naissance",
        name_ar="مضمون ولادة",
        description_fr="Une copie officielle de votre acte de naissance. Précisez si c'est un acte original, une déclaration ou un jugement.",
        description_ar="نسخة رسمية من رسم ولادتكم. يجب التوضيح إن كان رسماً أصلياً أو تصريحاً أو حكماً.",
        processing_time="24 heures"
    )
    extract_req_common = [
        ("Numéro de l'acte, année et jour de l'événement", "رقم الرسم والسنة واليوم الخاص بالحدث"),
        ("Paiement des frais (en espèces ou mandat postal)", "دفع معلوم الوثائق (نقداً أو بحوالة بريدية)"),
        ("Copie de la CIN (pour vérification)", "نسخة من بطاقة التعريف الوطنية (للتثبت)")
    ]
    for fr, ar in extract_req_common:
        Requirement.objects.get_or_create(service=birth, name_fr=fr, name_ar=ar)

    marriage_extract, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Extrait de Mariage",
        name_ar="مضمون زواج",
        description_fr="Copie de l'acte de mariage. Précisez s'il a été fait à la mairie ou chez un notaire (Adoul).",
        description_ar="نسخة من رسم الزواج. يجب التوضيح إن كان العقد أبرم بالبلدية أم لدى عدول إشهاد.",
        processing_time="24 heures"
    )
    for fr, ar in extract_req_common:
        Requirement.objects.get_or_create(service=marriage_extract, name_fr=fr, name_ar=ar)

    death_extract, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Extrait de Décès",
        name_ar="مضمون وفاة",
        description_fr="Copie officielle de l'acte de décès enregistrée dans les registres de la commune.",
        description_ar="نسخة رسمية من رسم الوفاة المسجل بدفاتر الحالة المدنية بالبلدية.",
        processing_time="24 heures"
    )
    for fr, ar in extract_req_common:
        Requirement.objects.get_or_create(service=death_extract, name_fr=fr, name_ar=ar)

    residence, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Attestation de Résidence Principale",
        name_ar="طلب شهادة مسكن رئيسي",
        description_fr="Pour obtenir un justificatif officiel de votre domicile principal à Kélibia.",
        description_ar="للحصول على شهادة رسمية تثبت مقر سكنك الرئيسي في مدينة قليبية.",
        processing_time="24 à 48 heures"
    )
    residence_reqs = [
        ("Copie de la Carte d'Identité Nationale (CIN)", "نسخة من بطاقة التعريف الوطنية"),
        ("Attestation de décharge de la recette municipale (Quitus)", "شهادة إبراء من القباضة البلدية"),
        ("Copie de l'acte de décès (si applicable)", "نسخة من حجة الوفاة")
    ]
    for fr, ar in residence_reqs:
        Requirement.objects.get_or_create(service=residence, name_fr=fr, name_ar=ar)

    birth_correction, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Correction d'acte de naissance",
        name_ar="تصحيح مضمون ولادة",
        description_fr="Pour corriger une erreur sur votre acte de naissance (nom, prénom, etc.). Demande adressée au Ministre de l'Intérieur.",
        description_ar="لتصحيح خطأ في رسم الولادة (اللقب، الاسم، إلخ). مطلب موجه إلى وزير الداخلية.",
        processing_time="2 mois (خلال شهرين)"
    )
    correction_reqs = [
        ("Demande au Ministre de l'Intérieur (signature légalisée)", "مطلب موجه إلى وزير الداخلية معرِف بإمضاء المعني بالأمر"),
        ("Extrait de naissance de l'intéressé", "مضمون ولادة المعني بالأمر"),
        ("Extrait de naissance ou de décès du père", "مضمون ولادة أو وفاة لوالد الطالب"),
        ("Extraits de naissance des frères/sœurs (avec le nom correct)", "مضامين ولادة لأشقاء الطالب تتضمن اللقب المختلف"),
        ("Copie de la carte d'identité (CIN)", "نسخة من بطاقة تعريف المعني بالأمر")
    ]
    for fr, ar in correction_reqs:
        Requirement.objects.get_or_create(service=birth_correction, name_fr=fr, name_ar=ar)

    death_declaration, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Déclaration de décès",
        name_ar="إعلام بحالة وفاة",
        description_fr="Pour enregistrer officiellement un décès survenu à Kélibia. Doit être fait dans les 3 jours.",
        description_ar="للتصريح الرسمي بحالة وفاة في مدينة قليبية. يجب أن يتم ذلك خلال 3 أيام من تاريخ الوفاة.",
        processing_time="Immédiat ou sous 3 jours (حيني أو خلال 3 أيام)"
    )
    death_reqs = [
        ("Informations sur le défunt (CIN ou extrait de naissance)", "معلومات عن المتوفي (بطاقة التعريف أو مضمون الولادة)"),
        ("Rapport de police (si décès dans des conditions suspectes)", "تقرير المصالح الأمنية (إذا كانت الوفاة في ظروف مشبوهة)"),
        ("Informations sur le déclarant (Proche ou personne informée)", "هوية المُعلِم (قريب المتوفي أو شخص مطلع)")
    ]
    for fr, ar in death_reqs:
        Requirement.objects.get_or_create(service=death_declaration, name_fr=fr, name_ar=ar)

    birth_registration, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Enregistrement de naissance",
        name_ar="ترسيم ولادة",
        description_fr="Pour enregistrer officiellement un nouveau-né. Doit être fait dans les 10 jours suivant la naissance.",
        description_ar="للتسجيل الرسمي للمولود الجديد. يجب أن يتم ذلك خلال 10 أيام من تاريخ الولادة.",
        processing_time="Immédiat (خلال 10 أيام كأقصى أجل)"
    )
    birth_reg_reqs = [
        ("Déclaration de l'hôpital, de la clinique ou du témoin", "إعلام من طرف المستشفى أو المصحة أو من عاين الولادة"),
        ("Justificatif d'identité des parents (CIN, Livret de famille...)", "إثبات هوية الأب والأم (بطاقة تعريف، دفتر عائلي...)"),
        ("Signature du déclarant sur le registre municipal", "إمضاء المعلم بدفتر ترسيم الولادات بالبلدية")
    ]
    for fr, ar in birth_reg_reqs:
        Requirement.objects.get_or_create(service=birth_registration, name_fr=fr, name_ar=ar)

    burial_permit, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Permission d'inhumation",
        name_ar="الإذن بالدفن",
        description_fr="Document nécessaire pour procéder à l'enterrement. Un certificat médical ou une autorisation judiciaire est requis selon le cas.",
        description_ar="وثيقة ضرورية للقيام بعملية الدفن. تتطلب شهادة طبية أو إذناً قضائياً حسب الحالة.",
        processing_time="Immédiat (حينيا)"
    )
    burial_reqs = [
        ("Certificat médical constatant le décès naturel", "شهادة طبية تفيد أن الموت تمت في ظروف طبيعية"),
        ("Autorisation du Procureur (si décès suspect ou accidentel)", "إذن من وكيل الجمهورية إذا كانت الموت في ظروف غير عادية"),
        ("Rapport des services de sécurité (si décès non naturel)", "تقرير المصالح الأمنية في حالة الموت غير الطبيعية"),
        ("Paiement du droit de timbre sur le document", "المعلوم الموظف على الوثيقة المطلوبة")
    ]
    for fr, ar in burial_reqs:
        Requirement.objects.get_or_create(service=burial_permit, name_fr=fr, name_ar=ar)

    family_book, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Livret de Famille",
        name_ar="استخراج الدفتر العائلي",
        description_fr="Document officiel regroupant les membres d'une famille. Indispensable pour prouver le lien de parenté.",
        description_ar="وثيقة رسمية تجمع أعضاء العائلة. ضرورية لإثبات صلة القرابة والتعاملات الإدارية.",
        processing_time="Immédiat (lors du mariage) ou 1 semaine (بمناسبة الزواج أو خلال أسبوع)"
    )
    family_book_reqs = [
        ("Photo du chef de famille (facultative)", "صورة شمسية لرئيس العائلة (اختيارية)"),
        ("Extrait de mariage", "مضمون زواج"),
        ("Extrait de naissance pour chacun des deux époux", "مضمون ولادة لكل من الزوجين"),
        ("Extraits des enfants (si renouvellement ou duplicata)", "مضامين للأبناء (في صورة التجديد أو استخراج نظير)"),
        ("Extrait de décès de l'époux (si délivré à la mère)", "مضمون وفاة الزوج عند تسليم الدفتر للام"),
        ("Copie du jugement de divorce (pour la mère divorcée)", "نسخة من حكم الطلاق (بالنسبة للزوجه المطلقة الحاضنة)"),
        ("Paiement des droits sur le Livret de Famille", "المعلوم الموظف على الدفتر العائلي")
    ]
    for fr, ar in family_book_reqs:
        Requirement.objects.get_or_create(service=family_book, name_fr=fr, name_ar=ar)

    transfer_corps, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Permis de transfert de corps",
        name_ar="رخصة نقل جثة من مكان لآخر",
        description_fr="Autorisation nécessaire pour déplacer un défunt d'un lieu à un autre. Des règles strictes s'appliquent en cas de maladie contagieuse.",
        description_ar="رخصة ضرورية لنقل جثة من مكان لآخر. تطبق إجراءات خاصة في صورة الوفاة بمرض معدي لضمان حفظ الصحة.",
        processing_time="Immédiat (حينيا)"
    )
    transfer_reqs = [
        ("Extrait d'acte de décès", "مضمون رسم وفاة"),
        ("Certificat médical (non-contagion)", "شهادة طبية تفيد أن أسباب الوفاة ليست ناتجة عن مرض معد"),
        ("Note: Transport direct si maladie contagieuse", "ملاحظة: نقل مباشر للمقبرة في صورة الوفاة بمرض معدي")
    ]
    for fr, ar in transfer_reqs:
        Requirement.objects.get_or_create(service=transfer_corps, name_fr=fr, name_ar=ar)

    legalisation, _ = Service.objects.get_or_create(
        category=etat_civil,
        name_fr="Légalisation de Signature",
        name_ar="التعريف بالإمضاء",
        description_fr="La légalisation de signature est la procédure par laquelle l’administration confirme l’authenticité d’une signature apposée sur un document.",
        description_ar="التعريف بالإمضاء هو الإجراء الذي تؤكد من خلاله الإدارة صحة التوقيع الموجود على الوثيقة.",
        processing_time="Immédiat (حينياً)",
        form_pdf_ar="service_forms/ar/التعريف_بالإمضاء.pdf"
    )
    legalisation_reqs = [
        ("Le document à légaliser", "الوثيقة المراد التعريف بها"),
        ("Pièce d'identité officielle (CIN ou passeport)", "الوثيقة الرسمية لإثبات الهوية (بطاقة التعريف، جواز سفر)")
    ]
    for fr, ar in legalisation_reqs:
        Requirement.objects.get_or_create(service=legalisation, name_fr=fr, name_ar=ar)

    # 2. Social & Vie Citoyenne (الشؤون الاجتماعية والحياة المدنية)
    social, _ = Category.objects.get_or_create(
        name_fr="Social & Événements",
        name_ar="الشؤون الاجتماعية والمناسبات",
        icon="fa-users"
    )

    family_party, _ = Service.objects.get_or_create(
        category=social,
        name_fr="Autorisation de fête familiale",
        name_ar="رخصة إقامة حفل عائلي",
        description_fr="Demande pour organiser une fête ou un événement familial privé (mariage, réception) à domicile.",
        description_ar="مطلب لتنظيم حفل أو بمناسبة عائلية خاصة (زواج، استقبال) بمنزل أو فضاء خاص.",
        processing_time="24 heures"
    )
    party_reqs = [
        ("Demande sur papier libre (Date et adresse complète)", "مطلب على ورق عادي يتضمن التاريخ والعنوان الكامل للمحل")
    ]
    for fr, ar in party_reqs:
        Requirement.objects.get_or_create(service=family_party, name_fr=fr, name_ar=ar)

    # 3. Urbanisme & Travaux (التعمير والأشغال)
    urbanisme, _ = Category.objects.get_or_create(
        name_fr="Maison & Construction",
        name_ar="المنزل والبناء",
        icon="fa-house-chimney"
    )

    permis_batir, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Autorisation de construire",
        name_ar="رخصة بناء (أو ترميم / إصلاح)",
        description_fr=(
            "Indispensable pour toute construction, restauration ou rénovation. "
            "Frais (Tarifs par m²) : 1-100m²: 15DT + 0.1DT/m² | 100-200m²: 60DT + 0.3DT/m² | "
            "200-300m²: 120DT + 0.4DT/m² | 300-400m²: 300DT + 0.6DT/m² | >400m²: 750DT + 1DT/m²."
        ),
        description_ar=(
            "ضرورية لكل من يرغب في بناء أو ترميم أو إصلاح. "
            "المعاليم (حسب المساحة): 1-100م²: 15د + 0.1د/م² | 100-200م²: 60د + 0.3د/م² | "
            "200-300م²: 120د + 0.4د/م² | 300-400م²: 300د + 0.6د/م² | أكثر من 400م²: 750د + 1د/م²."
        ),
        processing_time="15 à 45 jours"
    )
    urbanisme_reqs = [
        ("Mande sur papier libre (2 exemplaires)", "مطلب على ورق عادي ممضى (2 نظائر)"),
        ("Certificat de propriété, jugement ou titre foncier (2 exemplaires)", "شهادة ملكية أو حكم استحقاقي (2 نظائر)"),
        ("Fiche de renseignements techniques signée par l'architecte (2 exemplaires)", "بطاقة إرشادات فنية ممضاة من طرف المهندس المعماري (2 نظائر)"),
        ("Projet de construction complet (5 exemplaires)", "مشروع بناء كامل (5 نظائر)"),
        ("Reçu du dépôt de la déclaration d'impôt (IRPP ou IS) (5 exemplaires)", "وصل إيداع التصريح بالضريبة على الدخل أو على الشركات (5 نظائر)"),
        ("Quittance de paiement des taxes sur le bien", "شهادة خلاص المعاليم الموظفة على صاحب العقار"),
        ("Étude de performance thermique (pour >500m² ou bureaux)", "دراسة فنية للنجاعة الحرارية (للمباني > 500م² أو المكاتب)"),
        ("Note de présentation (2 exemplaires)", "مذكرة تقديمية (2 نظائر)")
    ]
    for fr, ar in urbanisme_reqs:
        Requirement.objects.get_or_create(service=permis_batir, name_fr=fr, name_ar=ar)


    terrasement, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Demande de Goudronnage de la Rue",
        name_ar="طلب تعبيد طريق",
        description_fr="Pour demander le goudronnage ou l'aménagement de la route devant votre résidence.",
        description_ar="لطلب تعبيد الطريق أو تهيئتها أمام مقر سكنك.",
        processing_time="Suivi par les services techniques"
    )
    paving_reqs = [
        ("Identité du demandeur (Nom et prénom)", "هوية صاحب المطلب (الاسم واللقب)"),
        ("Copie de la CIN (Numéro et date)", "نسخة من بطاقة التعريف الوطنية (الرقم وتاريخ الإصدار)"),
        ("Adresse de résidence", "عنوان السكن"),
        ("Localisation exacte de la rue concernée", "الموقع الدقيق للطريق أو النهج المطلوب تعبيده")
    ]
    for fr, ar in paving_reqs:
        Requirement.objects.get_or_create(service=terrasement, name_fr=fr, name_ar=ar)

    vocation, _ = Service.objects.get_or_create(
        category=urbanisme,
        name_fr="Certificat de vocation d'un bien immobilier",
        name_ar="شهادة في صبغة عقار",
        description_fr="Pour connaître l'usage autorisé d'un terrain ou d'un bâtiment (industriel, agricole, urbain, etc.).",
        description_ar="للحصول على وثيقة رسمية تبين صبغة العقار (صناعي، فلاحي، فضاء تعمير...)",
        processing_time="7 à 10 jours"
    )
    vocation_reqs = [
        ("Copie de la Carte d’Identité Nationale (CIN)", "نسخة من بطاقة التعريف الوطنية"),
        ("Certificat de décharge fiscale municipale (Quitus)", "شهادة إبراء الأداءات البلدية للسنة الجارية"),
        ("Copie du certificat de propriété récent", "نسخة من شهادة الملكية حديثة العهد"),
        ("Plan cadastral (Extrait du plan)", "مثال للرسم العقاري"),
        ("Plan de situation du bien immobilier", "مثال موقعي للعقار موضوع الطلب")
    ]
    for fr, ar in vocation_reqs:
        Requirement.objects.get_or_create(service=vocation, name_fr=fr, name_ar=ar)

    # 3. Fiscalité & Finance (المالية والضرائب)
    fiscalite, _ = Category.objects.get_or_create(
        name_fr="Argent & Impôts",
        name_ar="الأموال والأداءات",
        icon="fa-wallet"
    )

    # Common requirements for Municipal Tax Services
    tax_reqs_common = [
        ("Copie de la carte d'identité (CIN)", "نسخة من بطاقة التعريف الوطنية"),
        ("Justificatif de propriété (Acte d'achat/contrat)", "وثيقة إثبات الملكية (عقد شراء/عقد)"),
        ("Quittance de paiement des taxes (Année en cours)", "وصل خلاص الأداءات للسنة الجارية"),
        ("Certificat de décharge fiscale (Quitus municipal)", "شهادة إبراء من القباضة البلدية"),
        ("Plan de situation du bien concerné", "مثال موقعي للعقار موضوع الطلب"),
        ("Copie du permis de bâtir (si disponible)", "نسخة من قرار رخصة البناء (إن وجدت)"),
    ]

    # 3.1 Enregistrement d'un bien (Registration)
    reg_prop, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Enregistrement d'un bien (Rez-de-chaussée, étage, garage)",
        name_ar="ترسيم عقار (طابق أرضي، علوي، مستودع...)",
        description_fr="Pour déclarer une nouvelle construction ou une extension (étage, garage, etc.) aux services fiscaux.",
        description_ar="للتصريح ببناء جديد أو توسعة (طابق إضافي، مستودع...) لدى المصالح الجبائية.",
        processing_time="7 à 15 jours"
    )
    for fr, ar in tax_reqs_common:
        Requirement.objects.get_or_create(service=reg_prop, name_fr=fr, name_ar=ar)

    # 3.2 Changement de propriété (Change of Ownership)
    change_owner, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Changement de propriété (Achat ou héritage)",
        name_ar="تغيير ملكية عقار (إثر شراء أو إرث)",
        description_fr="Pour mettre à jour les registres fiscaux après l'acquisition d'un bien immobilier.",
        description_ar="لتحيين السجلات الجبائية بعد انتقال ملكية عقار (بيع، شراء، إرث).",
        processing_time="5 jours"
    )
    for fr, ar in tax_reqs_common:
        Requirement.objects.get_or_create(service=change_owner, name_fr=fr, name_ar=ar)

    # 3.3 Changement de vocation (Change of Usage)
    change_vocation, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Changement de vocation (Logement en commerce, etc.)",
        name_ar="تغيير صبغة عقار (من سكن إلى تجارة...)",
        description_fr="Pour modifier l'usage officiel d'un local dans les registres municipaux.",
        description_ar="لتغيير نوعية استعمال العقار (مثلاً من سكنى إلى محلي تجاري).",
        processing_time="10 à 20 jours"
    )
    for fr, ar in tax_reqs_common:
        Requirement.objects.get_or_create(service=change_vocation, name_fr=fr, name_ar=ar)

    # 3.4 Déclaration d'arrêt d'activité (Business Cessation)
    stop_business, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Déclaration d'arrêt d'activité (Fermer une boutique)",
        name_ar="إعلام بإيقاف نشاط (غلق محل أو شركة)",
        description_fr="Pour informer la mairie de la fermeture définitive de votre activité commerciale.",
        description_ar="لإعلام البلدية بالتوقف النهائي عن ممارسة النشاط التجاري.",
        processing_time="Instantané"
    )
    stop_business_reqs = [
        ("Remplir le formulaire 'Déclaration de cessation d'activité' (Infos personnelles et adresse)", "تعبئة استمارة 'إعلام بإيقاف نشاط' (البيانات الشخصية وعنوان المحل)"),
        ("Quittance de fermeture du matricule fiscal (Reçu de la Recette des Finances)", "وصل خلاص في غلق معرف جبائي (المتحصل عليه من قباضة المالية)"),
        ("Copie de la Carte d'Identité Nationale (CIN)", "نسخة من بطاقة التعريف الوطنية"),
        ("Certificat de décharge fiscale municipale (Quitus municipal)", "شهادة إبراء الأداءات البلدية (للتأكد من خلاص كل المعاليم)")
    ]
    for fr, ar in stop_business_reqs:
        Requirement.objects.get_or_create(service=stop_business, name_fr=fr, name_ar=ar)

    # 3.5 Certificat d'inscription au rôle d'imposition (Tax Registration Certificate)
    tax_cert, _ = Service.objects.get_or_create(
        category=fiscalite,
        name_fr="Certificat d'inscription au rôle d'imposition",
        name_ar="شهادة في ترسيم عقار بجدول التحصيل",
        description_fr="Prouve que votre propriété est officiellement enregistrée dans les registres fiscaux de la commune.",
        description_ar="وثيقة رسمية تثبت ترسيم العقارات (المبنية أو غير المبنية) بجدول التحصيل لبلدية قليبية.",
        processing_time="3 à 5 jours"
    )
    tax_cert_reqs = [
        ("Copie de la CIN", "نسخة من بطاقة التعريف الوطنية"),
        ("Justificatif de propriété (Acte d'achat, certificat...)", "وثيقة إثبات الملكية (عقد شراء، شهادة ملكية...)"),
        ("Quitus fiscal municipal (Attestation de décharge)", "شهادة إبراء من القباضة المالية في خلاص المعاليم البلدية"),
        ("Emplacement exact (Rue, quartier)", "موقع العقار (النهج والمنطقة)"),
        ("Nature du bien (Bâtiment ou terrain nu)", "نوع العقار (عقارات مبنية أو غير مبنية)")
    ]
    for fr, ar in tax_cert_reqs:
        Requirement.objects.get_or_create(service=tax_cert, name_fr=fr, name_ar=ar)

    # 4. Autorisations Commerciales (المشاريع والمحلات)
    commerce, _ = Category.objects.get_or_create(
        name_fr="Boutiques & Commerces",
        name_ar="المحلات والمشاريع",
        icon="fa-shop"
    )

    enseigne_pub, _ = Service.objects.get_or_create(
        category=commerce,
        name_fr="Licence d'installation d'une enseigne publicitaire",
        name_ar="رخصة في تركيز علامة إشهارية",
        description_fr="Pour obtenir l'autorisation d'installer une enseigne ou un panneau d'affichage sur votre commerce.",
        description_ar="للحصول على الموافقة لتركيز لافتة إشهارية أو علامة فوق محلك التجاري.",
        processing_time="10 jours"
    )
    enseigne_reqs = [
        ("Identité du demandeur (Nom, prénom, adresse)", "هوية صاحب المطلب (الاسم واللقب والعنوان الكامله)"),
        ("Copie de la CIN (Numéro et date)", "نسخة من بطاقة التعريف الوطنية (الرقم وتاريخ الإصدار)"),
        ("Emplacement exact du local à Kélibia", "الموقع الدقيق للمحل في مدينة قليبية"),
        ("Surface totale de l'enseigne en m²", "المساحة الجملية للعلامة الإشهارية بالمتر المربع"),
        ("Contenu exact de l'enseigne (AR/FR)", "النص الكامل الذي سيكتب على اللافتة (بالعربية والفرنسية)")
    ]
    for fr, ar in enseigne_reqs:
        Requirement.objects.get_or_create(service=enseigne_pub, name_fr=fr, name_ar=ar)

    # 5. Réseaux & Services Publics (الربط بالخدمات)
    reseaux, _ = Category.objects.get_or_create(
        name_fr="Eau, Lumière et Égouts",
        name_ar="الماء والكهرباء والتطهير",
        icon="fa-bolt"
    )

    connexion_reseau, _ = Service.objects.get_or_create(
        category=reseaux,
        name_fr="Demande de raccordement aux réseaux municipaux (eau, électricité, assainissement)",
        name_ar="طلب الربط بالشبكات البلدية (ماء، كهرباء، تطهير)",
        description_fr="Pour obtenir l'autorisation de brancher votre local aux réseaux d'eau, d'électricité ou d'assainissement.",
        description_ar="للحصول على الموافقة لربط عقارك بشبكات الماء الصالح للشرب، الكهرباء، أو التطهير.",
        processing_time="15 jours"
    )
    reseaux_reqs = [
        ("Copie de la Carte d'Identité Nationale (CIN)", "نسخة من بطاقة التعريف الوطنية"),
        ("Copie du justificatif de propriété", "نسخة من وثيقة إثبات الملكية"),
        ("Copie du contrat de location (pour locaux commerciaux)", "نسخة من عقد الكراء للمحلات التجارية"),
        ("Quittance de paiement de la taxe foncière (année en cours)", "وصل خلاص العقار موضوع الطلب للسنة الجارية"),
        ("Certificat de décharge fiscale municipale (Quitus)", "شهادة إبراء الأداءات البلدية للسنة الجارية"),
        ("Copie du permis de bâtir (si disponible)", "نسخة من قرار رخصة البناء (إن وجدت)"),
        ("Étude technique (pour percement de chaussée)", "دراسة فنية مسلمة من المصالح المعنية (لتراخيص شق الطريق)")
    ]
    for fr, ar in reseaux_reqs:
        Requirement.objects.get_or_create(service=connexion_reseau, name_fr=fr, name_ar=ar)

    print("Base de données mise à jour avec les nouveaux services !")
    print("NOTE: Vous pouvez maintenant ajouter les chemins des fichiers PDF (AR/FR) via l'admin Django.")

if __name__ == "__main__":
    seed_services()
