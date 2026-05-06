"""
Centralised notification text registry.
Use get_notif(user, key, **fmt) to get (title, message) in the user's language.
"""

TEXTS = {
    'account_verified': {
        'fr': {
            'title': 'Compte Vérifié',
            'message': "Votre compte a été vérifié avec succès par l'administration. Vous pouvez maintenant accéder à tous nos services.",
        },
        'ar': {
            'title': 'تأكيد الحساب',
            'message': "تم تأكيد حسابك بنجاح من قبل الإدارة. يمكنك الآن الوصول إلى جميع خدماتنا.",
        },
    },
    'asd_activated': {
        'fr': {
            'title': 'Abonnement ASD Activé',
            'message': "Félicitations ! Votre abonnement aux Services Digitaux (ASD) a été activé pour {months} mois. Vous pouvez désormais demander vos extraits et documents gratuitement.",
        },
        'ar': {
            'title': 'تفعيل اشتراك الخدمات الرقمية',
            'message': "تهانينا! تم تفعيل اشتراكك في الخدمات الرقمية (ASD) لمدة {months} شهرًا. يمكنك الآن طلب وثائقك مجانًا.",
        },
    },
    'signalement_created': {
        'fr': {
            'title': 'Signalement enregistré',
            'message': "Votre signalement « {title} » a été enregistré avec succès. Nous vous tiendrons informé de son évolution.",
        },
        'ar': {
            'title': 'تم تسجيل البلاغ',
            'message': "تم تسجيل بلاغك « {title} » بنجاح. سيتم إعلامك بالتطورات.",
        },
    },
    'signalement_updated': {
        'fr': {
            'title': 'Mise à jour: {rec_title}',
            'message': "Le statut de votre signalement « {rec_title} » est passé à : {status_display}.",
        },
        'ar': {
            'title': 'تحديث: {rec_title}',
            'message': "تم تحديث حالة بلاغك « {rec_title} » إلى: {status_display}.",
        },
    },
    'request_updated': {
        'fr': {
            'title': 'Mise à jour: {type_label}',
            'message': "Le statut de votre demande ({type_label} #{obj_id}) a été mis à jour: {status_display}.",
        },
        'ar': {
            'title': 'تحديث: {type_label}',
            'message': "تم تحديث حالة طلبك ({type_label} #{obj_id}) إلى: {status_display}.",
        },
    },
    'birth_updated': {
        'fr': {
            'title': 'Mise à jour: Déclaration de Naissance',
            'message': "Le statut de votre déclaration de naissance #{obj_id} a été mis à jour: {status_display}.",
        },
        'ar': {
            'title': 'تحديث: إعلان الولادة',
            'message': "تم تحديث حالة إعلان الولادة #{obj_id} إلى: {status_display}.",
        },
    },
    'livret_updated': {
        'fr': {
            'title': 'Mise à jour: Livret de famille',
            'message': "Le statut de votre demande de livret de famille #{obj_id} a été mis à jour: {status_display}.",
        },
        'ar': {
            'title': 'تحديث: دفتر العائلة',
            'message': "تم تحديث حالة طلب دفتر العائلة #{obj_id} إلى: {status_display}.",
        },
    },
    'event_updated': {
        'fr': {
            'title': "Mise à jour: Événement",
            'message': "Le statut de votre demande d'événement a été mis à jour: {status_display}.",
        },
        'ar': {
            'title': 'تحديث: طلب الفعالية',
            'message': "تم تحديث حالة طلب الفعالية الخاصة بك إلى: {status_display}.",
        },
    },
}


def get_notif(user, key, **fmt):
    """
    Returns (title, message) in the user's preferred language.
    Falls back to French if the key or language is missing.
    """
    lang = getattr(user, 'preferred_language', 'fr') or 'fr'
    entry = TEXTS.get(key, {})
    texts = entry.get(lang) or entry.get('fr') or {'title': key, 'message': ''}
    title = texts['title'].format(**fmt) if fmt else texts['title']
    message = texts['message'].format(**fmt) if fmt else texts['message']
    return title, message
