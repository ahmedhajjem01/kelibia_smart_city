import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageProvider'

export default function MesDemandesPage() {
  const { t, setLang, lang } = useI18n()

  const categories = [
    {
      id: 'birth',
      title: t('birth_requests_title'),
      desc: t('birth_requests_desc'),
      icon: 'fa-baby',
      color: 'success',
      link: '/mes-extraits',
    },
    {
      id: 'marriage',
      title: t('marriage_requests_title'),
      desc: t('marriage_requests_desc'),
      icon: 'fa-ring',
      color: 'primary',
      link: '/mes-mariages',
    },
    {
      id: 'death',
      title: t('death_requests_title'),
      desc: t('death_requests_desc'),
      icon: 'fa-dove',
      color: 'dark',
      link: '/mes-deces',
    },
    {
      id: 'residence',
      title: t('residence_requests_title'),
      desc: t('residence_requests_desc'),
      icon: 'fa-home',
      color: 'warning',
      link: '/mes-residences',
    },
  ]

  return (
    <div className="bg-light min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <Link className="navbar-brand" to="/dashboard">
            Kelibia Smart City
          </Link>
          <div className="d-flex align-items-center">
            <div className="btn-group me-3" role="group">
              <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setLang('fr')}>
                <img src="https://flagcdn.com/w40/fr.png" width="20" alt="FR" />
              </button>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setLang('ar')}>
                <img src="https://flagcdn.com/w40/tn.png" width="20" alt="TN" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className={`container py-5 ${lang === 'ar' ? 'text-end' : ''}`}>
        <div className="text-center mb-5">
          <h1 className="fw-bold text-primary">{t('my_requests')}</h1>
          <p className="text-muted">{t('my_requests_desc')}</p>
        </div>

        <div className="row g-4">
          {categories.map((cat) => (
            <div key={cat.id} className="col-md-6 col-lg-3">
              <Link to={cat.link} className="text-decoration-none h-100 d-block">
                <div className={`card h-100 shadow-sm border-0 border-bottom border-4 border-${cat.color} hover-lift transition-all`}>
                  <div className="card-body p-4 text-center">
                    <div className={`bg-${cat.color} bg-opacity-10 rounded-circle p-3 d-inline-block mb-3`}>
                      <i className={`fas ${cat.icon} fa-2x text-${cat.color}`}></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">{cat.title}</h5>
                    <p className="text-muted small mb-0">{cat.desc}</p>
                  </div>
                  <div className="card-footer bg-white border-0 text-center pb-4">
                    <span className={`btn btn-sm btn-outline-${cat.color} rounded-pill px-3`}>
                      {t('view_details')} <i className={`fas ${lang === 'ar' ? 'fa-chevron-left' : 'fa-chevron-right'} ms-1`}></i>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <Link to="/dashboard" className="btn btn-outline-secondary rounded-pill px-4">
            <i className={`fas ${lang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'} me-2`}></i> {t('home')}
          </Link>
        </div>
      </div>

      <style>{`
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
      `}</style>
    </div>
  )
}
