import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  fr: {
    dashboard: 'Tableau de bord',
    logout: 'Déconnexion',
    loading: 'Chargement...',
    close: 'Fermer',
    submit: 'Envoyer',
    processing: 'Traitement en cours...',
    success_msg: 'Opération réussie !',
    error_msg: 'Une erreur est survenue.',
    home: 'Accueil',
    municipality: 'بلدية قليبية — Commune de Kélibia',
    smart_city: 'Portail Citoyen — Kelibia Smart City',
    welcome: 'Bienvenue,',
    welcome_msg: 'Gérez vos signalements et accédez aux services municipaux.',
    agent_welcome: 'Espace Agent —',
    citizen_role: 'Citoyen',
    citizen_portal: 'Portail Citoyen',
    navigation: 'NAVIGATION',
    account: 'COMPTE',
    admin_services: 'Services Administratifs',
    my_reclamations: 'Mes Réclamations',
    news_title: 'Actualités',
    profile: 'Mon Profil',
    reclamations_mgnt: 'Gestion des Réclamations',
    agent_dashboard: 'Tableau de bord Agent',
    stat_total: 'Total signalements',
    stat_pending: 'En attente',
    stat_inprogress: 'En cours',
    stat_resolved: 'Résolus',
    quick_actions: 'Actions Rapides',
    map_view: 'Carte SIG',
    new_reclamation: 'Nouveau Signalement',
    profile_type: 'Rôle',
    profile_city: 'Ville',
    profile_phone: 'Tél.',
    col_title: 'Titre',
    col_category: 'Catégorie',
    col_status: 'Statut',
    col_date: 'Date',
    col_photo: 'Photo (optionnel)',
    no_reclamations: 'Aucun signalement pour le moment.',
    services_desc: 'Consultez la liste des documents requis pour vos démarches municipales.',
    view_services: 'Voir les services',
    retrieval_error: 'Erreur lors de la récupération des services.',
    no_services: 'Aucun service disponible pour le moment.',
    documents_required: 'Documents requis :',
    estimated_time: 'Délai estimé',
    request_online: 'Demander en ligne (Bientôt)',
    loading_services: 'Chargement des services...',
    details_title: 'Détails du service',
    download_form: 'Télécharger le formulaire',
    download_form_ar: 'Télécharger (Version Arabe)',
    news_desc: 'Restez informé des derniers événements et annonces de votre commune.',
    reclamations_desc: 'Signalez un problème (éclairage, déchets, voirie) et suivez sa résolution.',
    your_token: 'Votre Token d'Accès :',
    view_reclamations: 'Voir les réclamations',
  },
  ar: {
    dashboard: 'لوحة القيادة',
    logout: 'تسجيل الخروج',
    loading: 'جاري التحميل...',
    close: 'إغلاق',
    submit: 'إرسال',
    processing: 'جاري المعالجة...',
    success_msg: 'تمت العملية بنجاح!',
    error_msg: 'حدث خطأ ما.',
    home: 'الرئيسية',
    municipality: 'بلدية قليبية — Commune de Kélibia',
    smart_city: 'بوابة المواطن — قليبية مدينة ذكية',
    welcome: 'مرحباً بك،',
    welcome_msg: 'أدر بلاغاتك وتمتع بخدمات البلدية الإلكترونية.',
    agent_welcome: 'فضاء العون —',
    citizen_role: 'مواطن',
    citizen_portal: 'بوابة المواطن',
    navigation: 'التنقل',
    account: 'الحساب',
    admin_services: 'الخدمات الإدارية',
    my_reclamations: 'شكاويّ',
    news_title: 'الأخبار',
    profile: 'ملفي الشخصي',
    reclamations_mgnt: 'إدارة الشكاوى',
    agent_dashboard: 'لوحة قيادة العون',
    stat_total: 'إجمالي البلاغات',
    stat_pending: 'قيد الانتظار',
    stat_inprogress: 'قيد المعالجة',
    stat_resolved: 'تم الحل',
    quick_actions: 'إجراءات سريعة',
    map_view: 'خريطة SIG',
    new_reclamation: 'بلاغ جديد',
    profile_type: 'الدور',
    profile_city: 'المدينة',
    profile_phone: 'الهاتف',
    col_title: 'العنوان',
    col_category: 'الفئة',
    col_status: 'الحالة',
    col_date: 'التاريخ',
    col_photo: 'صورة (اختياري)',
    no_reclamations: 'لا توجد بلاغات حالياً.',
    services_desc: 'اطلع على قائمة الوثائق المطلوبة لمعاملاتك البلدية.',
    view_services: 'عرض الخدمات',
    retrieval_error: 'خطأ أثناء جلب الخدمات.',
    no_services: 'لا توجد خدمات متاحة حالياً.',
    documents_required: 'الوثائق المطلوبة:',
    estimated_time: 'الوقت المقدر',
    request_online: 'الطلب عبر الإنترنت (قريباً)',
    loading_services: 'جاري تحميل الخدمات...',
    details_title: 'تفاصيل الخدمة',
    download_form: 'تحميل المطبوعة',
    download_form_ar: 'تحميل (النسخة العربية)',
    news_desc: 'ابق على اطلاع بآخر الأحداث والبلاغات الصادرة عن بلديتك.',
    reclamations_desc: 'أبلغ عن مشكل (إضاءة، نفايات، طرقات) وتابع عملية الإصلاح.',
    your_token: 'رمز الدخول الخاص بك:',
    view_reclamations: 'عرض الشكاوى',
  }
}

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem('preferredLanguage') || 'fr')

  const setLanguage = (newLang) => {
    localStorage.setItem('preferredLanguage', newLang)
    setLangState(newLang)
    document.documentElement.lang = newLang
    document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    document.body.classList.toggle('arabic-font', newLang === 'ar')
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.body.classList.toggle('arabic-font', lang === 'ar')
  }, [lang])

  const t = (key) => translations[lang]?.[key] || key

  return (
    <LangContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)