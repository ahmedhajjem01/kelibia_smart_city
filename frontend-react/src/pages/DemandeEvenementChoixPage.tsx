import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import MainLayout from '../components/MainLayout'

export default function DemandeEvenementChoixPage() {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)

  useEffect(() => {
    const access = getAccessToken()
    if (!access) { navigate('/login'); return }
    fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setUser(d)).catch(() => {})
  }, [navigate])

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: lang === 'ar' ? 'طلب تنظيم فعالية' : "Demande d'autorisation d'événement" }]}
    >
      <div className="container py-2 pb-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">

            {/* Header */}
            <div className="text-center mb-5">
              <div className="d-inline-flex rounded-4 p-4 mb-3 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6f42c1, #0d6efd)', color: '#fff', fontSize: '2rem' }}>
                <i className="fas fa-calendar-plus"></i>
              </div>
              <h2 className="fw-bold mb-2" style={{ color: '#1a1a2e' }}>
                {lang === 'ar' ? 'طلب إذن تنظيم فعالية' : "Demande d'autorisation d'événement"}
              </h2>
              <p className="text-muted">
                {lang === 'ar'
                  ? 'اختر نوع الفعالية التي تريد تنظيمها'
                  : 'Choisissez le type d\'événement que vous souhaitez organiser'}
              </p>
            </div>

            {/* Choice cards */}
            <div className="row g-4">

              {/* PUBLIC */}
              <div className="col-12 col-md-6">
                <div
                  className="card border-0 rounded-4 shadow-sm h-100 text-center p-2"
                  style={{ cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', overflow: 'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(111,66,193,.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
                  onClick={() => navigate('/demande-evenement-public')}
                >
                  {/* Top color band */}
                  <div className="py-4 px-3" style={{ background: 'linear-gradient(135deg, #6f42c1 0%, #0d6efd 100%)' }}>
                    <i className="fas fa-bullhorn fa-3x text-white mb-3 d-block"></i>
                    <h4 className="fw-bold text-white mb-1">
                      {lang === 'ar' ? 'فعالية عمومية' : 'Événement Public'}
                    </h4>
                    <p className="text-white mb-0" style={{ opacity: .85, fontSize: '.88rem' }}>
                      {lang === 'ar' ? 'مفتوح للعموم' : 'Ouvert au grand public'}
                    </p>
                  </div>

                  <div className="p-4">
                    <p className="text-muted small mb-4" style={{ lineHeight: 1.7 }}>
                      {lang === 'ar'
                        ? 'للفعاليات المفتوحة للعموم كالحفلات الموسيقية، المهرجانات الثقافية، الأحداث الرياضية، الأسواق، الأنشطة الجمعوية...'
                        : 'Pour les événements ouverts au public : concerts, festivals culturels, événements sportifs, marchés, activités associatives, manifestations religieuses...'}
                    </p>

                    {/* Type pills */}
                    <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                      {[
                        { icon: 'fa-music', label: lang === 'ar' ? 'حفلة' : 'Concert' },
                        { icon: 'fa-theater-masks', label: lang === 'ar' ? 'ثقافي' : 'Culturel' },
                        { icon: 'fa-running', label: lang === 'ar' ? 'رياضي' : 'Sportif' },
                        { icon: 'fa-store', label: lang === 'ar' ? 'سوق' : 'Marché' },
                        { icon: 'fa-users', label: lang === 'ar' ? 'جمعوي' : 'Associatif' },
                        { icon: 'fa-hand-holding-heart', label: lang === 'ar' ? 'خيري' : 'Caritatif' },
                      ].map(t => (
                        <span key={t.label} className="badge rounded-pill px-3 py-2"
                          style={{ background: '#f0e6ff', color: '#6f42c1', fontSize: '.75rem' }}>
                          <i className={`fas ${t.icon} me-1`}></i>{t.label}
                        </span>
                      ))}
                    </div>

                    <button
                      className="btn rounded-pill px-5 py-2 fw-bold text-white w-100"
                      style={{ background: 'linear-gradient(135deg, #6f42c1, #0d6efd)', border: 'none' }}
                      onClick={() => navigate('/demande-evenement-public')}
                    >
                      <i className="fas fa-arrow-right me-2"></i>
                      {lang === 'ar' ? 'تقديم طلب فعالية عمومية' : 'Demander une autorisation'}
                    </button>
                  </div>
                </div>
              </div>

              {/* PRIVATE */}
              <div className="col-12 col-md-6">
                <div
                  className="card border-0 rounded-4 shadow-sm h-100 text-center p-2"
                  style={{ cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', overflow: 'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(25,135,84,.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
                  onClick={() => navigate('/demande-evenement-prive')}
                >
                  {/* Top color band */}
                  <div className="py-4 px-3" style={{ background: 'linear-gradient(135deg, #198754 0%, #20c997 100%)' }}>
                    <i className="fas fa-home fa-3x text-white mb-3 d-block"></i>
                    <h4 className="fw-bold text-white mb-1">
                      {lang === 'ar' ? 'فعالية خاصة' : 'Événement Privé'}
                    </h4>
                    <p className="text-white mb-0" style={{ opacity: .85, fontSize: '.88rem' }}>
                      {lang === 'ar' ? 'مدعوون فقط' : 'Sur invitation uniquement'}
                    </p>
                  </div>

                  <div className="p-4">
                    <p className="text-muted small mb-4" style={{ lineHeight: 1.7 }}>
                      {lang === 'ar'
                        ? 'للتظاهرات العائلية الخاصة كحفلات الزفاف، الأفراح العائلية، حفلات التخرج، والاحتفالات الخاصة...'
                        : 'Pour les événements familiaux privés : cérémonies de mariage, fêtes familiales, remises de diplômes, célébrations privées...'}
                    </p>

                    {/* Type pills */}
                    <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                      {[
                        { icon: 'fa-ring', label: lang === 'ar' ? 'زفاف' : 'Mariage' },
                        { icon: 'fa-birthday-cake', label: lang === 'ar' ? 'فرح عائلي' : 'Fête famille' },
                        { icon: 'fa-graduation-cap', label: lang === 'ar' ? 'تخرج' : 'Diplômes' },
                        { icon: 'fa-glass-cheers', label: lang === 'ar' ? 'احتفال' : 'Célébration' },
                      ].map(t => (
                        <span key={t.label} className="badge rounded-pill px-3 py-2"
                          style={{ background: '#e8f5e9', color: '#198754', fontSize: '.75rem' }}>
                          <i className={`fas ${t.icon} me-1`}></i>{t.label}
                        </span>
                      ))}
                    </div>

                    <button
                      className="btn rounded-pill px-5 py-2 fw-bold text-white w-100"
                      style={{ background: 'linear-gradient(135deg, #198754, #20c997)', border: 'none' }}
                      onClick={() => navigate('/demande-evenement-prive')}
                    >
                      <i className="fas fa-arrow-right me-2"></i>
                      {lang === 'ar' ? 'تقديم طلب فعالية خاصة' : 'Demander une autorisation'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="alert border-0 rounded-4 mt-4 d-flex align-items-start gap-3"
              style={{ background: '#f8f9fa' }}>
              <i className="fas fa-info-circle text-primary mt-1" style={{ fontSize: '1.1rem' }}></i>
              <div style={{ fontSize: '.85rem', color: '#555' }}>
                <strong>{lang === 'ar' ? 'لماذا التمييز؟' : 'Pourquoi deux formulaires ?'}</strong>
                <p className="mb-0 mt-1">
                  {lang === 'ar'
                    ? 'الفعاليات العمومية تتطلب خطة أمن ورخصة خاصة. الفعاليات الخاصة تتطلب فقط تصريح مسبق بسيط لضمان عدم التعارض مع فعاليات أخرى في نفس المكان.'
                    : 'Les événements publics nécessitent un plan de sécurité et des autorisations spécifiques. Les événements privés requièrent uniquement une déclaration préalable simple pour éviter les conflits de lieu.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  )
}
