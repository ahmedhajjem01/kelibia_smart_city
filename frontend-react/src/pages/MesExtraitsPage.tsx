import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAccessToken } from '../lib/authStorage'
import { useI18n } from '../i18n/LanguageProvider'
import { resolveBackendUrl } from '../lib/backendUrl'
import MainLayout from '../components/MainLayout'

export default function MesExtraitsPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string; is_verified: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch User Info
    fetch(resolveBackendUrl('/api/accounts/me/'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [navigate])

  const categories = [
    {
      id: 'birth',
      title: t('birth_extracts'),
      icon: 'fa-baby',
      color: '#4ade80', // green-400
      link: '/mes-naissances',
      desc: lang === 'ar' ? 'مضامين الولادة الخاصة بك وبأطفالك' : 'Vos extraits de naissance et ceux de vos enfants'
    },
    {
      id: 'marriage',
      title: t('marriage_extracts'),
      icon: 'fa-ring',
      color: '#fbbf24', // amber-400
      link: '/mes-mariages',
      desc: lang === 'ar' ? 'عقود الزواج المسجلة' : 'Vos actes de mariage enregistrés'
    },
    {
      id: 'death',
      title: t('death_extracts'),
      icon: 'fa-dove',
      color: '#64748b', // slate-500
      link: '/mes-deces',
      desc: lang === 'ar' ? 'مضامين الوفاة لأفراد العائلة' : 'Extraits de décès des membres de la famille'
    },
    {
      id: 'residence',
      title: t('residence_certs'),
      icon: 'fa-home',
      color: '#3b82f6', // blue-500
      link: '/mes-residences',
      desc: lang === 'ar' ? 'شهادات الإقامة المتحصل عليها' : 'Vos attestations de résidence validées'
    }
  ]

  return (
    <MainLayout
      user={user}
      onLogout={() => navigate('/login')}
      breadcrumbs={[{ label: t('extraits_hub_title') }]}
    >
      <div className={`py-4 ${lang === 'ar' ? 'text-end' : ''}`}>
        <div className="mb-5">
          <h1 className="fw-bold section-title mb-2">
            <i className="fas fa-folder-open me-2 text-primary"></i>
            {t('extraits_hub_title')}
          </h1>
          <p className="text-muted fs-5">{t('extraits_hub_desc')}</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <div className="row g-4">
            {categories.map((cat) => (
              <div className="col-md-6 col-lg-3" key={cat.id}>
                <Link 
                  to={cat.link} 
                  className="card h-100 border-0 shadow-sm hub-card text-decoration-none transition-all"
                  style={{ 
                    borderRadius: '20px', 
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, shadow 0.2s ease'
                  }}
                >
                  <div className="card-body p-4 d-flex flex-column align-items-center text-center">
                    <div 
                      className="icon-container mb-4 d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        backgroundColor: `${cat.color}15`, 
                        borderRadius: '24px',
                        color: cat.color
                      }}
                    >
                      <i className={`fas ${cat.icon} fa-2x`}></i>
                    </div>
                    <h4 className="fw-bold text-dark mb-2">{cat.title}</h4>
                    <p className="text-muted small mb-3">{cat.desc}</p>
                    <div className="mt-auto pt-2">
                      <span className="btn btn-sm btn-light rounded-pill px-3 fw-bold text-primary">
                        {lang === 'ar' ? 'دخول' : 'Accéder'} <i className={`fas fa-chevron-${lang === 'ar' ? 'left' : 'right'} ms-1 small`}></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <style>{`
          .hub-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 1rem 3rem rgba(0,0,0,0.1) !important;
          }
          .hub-card .btn-light {
            background-color: #f8fafc;
            border-color: #f1f5f9;
          }
        `}</style>
      </div>
    </MainLayout>
  )
}

