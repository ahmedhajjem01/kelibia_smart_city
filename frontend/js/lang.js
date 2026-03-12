const translations = {
    fr: {
        dashboard: "Tableau de bord",
        logout: "Déconnexion",
        welcome: "Bienvenue !",
        welcome_msg: "Vous êtes connecté avec succès au portail Kelibia Smart City.",
        admin_services: "Services Administratifs",
        services_desc: "Consultez la liste des documents requis pour vos démarches municipales (État civil, Urbanisme, etc.).",
        services_desc_long: "Retrouvez ici tous les documents nécessaires pour vos démarches municipales à Kelibia.",
        view_services: "Voir les services",
        your_token: "Votre Token d'Accès :",
        profile: "Profil",
        loading: "Chargement...",
        retrieval_error: "Erreur lors de la récupération des services. Veuillez réessayer plus tard.",
        no_services: "Aucun service disponible pour le moment.",
        documents_required: "Documents requis :",
        estimated_time: "Délai estimé",
        close: "Fermer",
        request_online: "Demander en ligne (Bientôt)",
        loading_services: "Chargement des services...",
        details_title: "Détails du service",
        home: "Accueil",
        download_form: "Télécharger le formulaire",
        download_form_ar: "Télécharger (Version Arabe)",
        agent_dashboard: "Tableau de bord Agent",
        reclamations_mgnt: "Gestion des Réclamations",
        view_reclamations: "Voir les réclamations",
        agent_welcome: "Bienvenue Agent !",
        my_reclamations: "Mes Réclamations",
        new_reclamation: "Nouvelle Réclamation",
        reclamations_desc: "Signalez un problème (éclairage, déchets, voirie) et suivez sa résolution.",
        news_title: "Actualités de Kélibia",
        news_desc: "Restez informé des derniers événements et annonces de votre commune.",
        submit: "Envoyer",
        processing: "Traitement en cours...",
        success_msg: "Opération réussie !",
        error_msg: "Une erreur est survenue."
    },
    ar: {
        dashboard: "لوحة القيادة",
        logout: "تسجيل الخروج",
        welcome: "مرحباً بك!",
        welcome_msg: "لقد سجلت دخولك بنجاح في بوابة قليبية مدينة ذكية.",
        admin_services: "الخدمات الإدارية",
        services_desc: "اطلع على قائمة الوثائق المطلوبة لمعاملاتك البلدية (الحالة المدنية، التعمير، إلخ).",
        services_desc_long: "تجدون هنا جميع الوثائق اللازمة لمختلف الإجراءات البلدية في قليبية.",
        view_services: "عرض الخدمات",
        your_token: "رمز الدخول الخاص بك:",
        profile: "الملف الشخصي",
        loading: "جاري التحميل...",
        retrieval_error: "خطأ أثناء جلب الخدمات. يرجى المحاولة مرة أخرى لاحقاً.",
        no_services: "لا توجد خدمات متاحة حالياً.",
        documents_required: "الوثائق المطلوبة:",
        estimated_time: "الوقت المقدر",
        close: "إغلاق",
        request_online: "الطلب عبر الإنترنت (قريباً)",
        loading_services: "جاري تحميل الخدمات...",
        details_title: "تفاصيل الخدمة",
        home: "الرئيسية",
        download_form: "تحميل المطبوعة",
        agent_dashboard: "لوحة قيادة العون",
        reclamations_mgnt: "إدارة الشكاوى",
        view_reclamations: "عرض الشكاوى",
        agent_welcome: "مرحباً أيها العون!",
        my_reclamations: "شكاويّ",
        new_reclamation: "شكوى جديدة",
        reclamations_desc: "أبلغ عن مشكل (إضاءة، نفايات، طرقات) وتابع عملية الإصلاح.",
        news_title: "أخبار قليبية",
        news_desc: "ابق على اطلاع بآخر الأحداث والبلاغات الصادرة عن بلديتك.",
        submit: "إرسال",
        processing: "جاري المعالجة...",
        success_msg: "تمت العملية بنجاح!",
        error_msg: "حدث خطأ ما."
    }
};

function initLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'fr';
    setLanguage(savedLang);
}

function setLanguage(lang) {
    localStorage.setItem('preferredLanguage', lang);
    document.documentElement.lang = lang;

    // Set text direction
    if (lang === 'ar') {
        document.body.dir = 'rtl';
        document.body.classList.add('arabic-font');
    } else {
        document.body.dir = 'ltr';
        document.body.classList.remove('arabic-font');
    }

    // Update static translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
}

function getLanguage() {
    return localStorage.getItem('preferredLanguage') || 'fr';
}

function getTranslation(key) {
    const lang = getLanguage();
    return translations[lang][key] || key;
}
